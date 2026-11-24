import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const body = await req.json();
    const {
      orderType = 'DINE_IN',
      tableId,
      tableNumber,
      customerName = 'Walk-in Guest',
      customerPhone = '+91 99999 00000',
      items = [],
      paymentMethod = 'CASH', // CASH, UPI, CARD, COUNTER, SPLIT
      discountAmount = 0,
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cannot create empty order' }, { status: 400 });
    }

    // Generate Order Number
    const countToday = await prisma.order.count({ where: { cafeId } });
    const orderNumber = `POS-${(countToday + 101).toString()}`;

    // Get cafe tax settings
    const setting = await prisma.cafeSetting.findUnique({ where: { cafeId } });
    const taxRate = setting?.taxRatePercent || 5.0;

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData: any[] = [];
    const menuItemIds: string[] = [];

    for (const item of items) {
      const lineSubtotal = Number(item.price) * Number(item.quantity);
      subtotal += lineSubtotal;
      if (item.menuItemId) menuItemIds.push(item.menuItemId);

      orderItemsData.push({
        menuItemId: item.menuItemId || null,
        itemName: item.name,
        variantName: item.variantName || null,
        quantity: Number(item.quantity),
        unitPrice: Number(item.price),
        subtotalPrice: lineSubtotal,
      });
    }

    const appliedDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
    const taxableAmount = Math.max(0, subtotal - appliedDiscount);
    const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          loyaltyPoints: Math.floor(totalAmount / 50), // 1 point per ₹50
          totalSpent: totalAmount,
          visitCount: 1,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: { increment: totalAmount },
          visitCount: { increment: 1 },
          loyaltyPoints: { increment: Math.floor(totalAmount / 50) },
        },
      });
    }

    // Transaction to create order, update table, deduct recipe ingredients, update cash shift
    const newOrder = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          cafeId,
          customerId: customer.id,
          tableId: tableId || null,
          tableNumber: tableNumber || null,
          orderNumber,
          orderType,
          status: 'PREPARING',
          subtotal,
          taxAmount,
          discountAmount: appliedDiscount,
          totalAmount,
          paymentStatus: paymentMethod === 'COUNTER' ? 'PENDING' : 'PAID',
          paymentMethod,
          customerName,
          customerPhone,
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: {
              newStatus: 'PREPARING',
              changedBy: session.name,
              note: `POS Terminal Order created via ${paymentMethod}`,
            },
          },
        },
        include: {
          items: true,
          table: true,
          customer: true,
        },
      });

      // If dine in with table, set table status to OCCUPIED
      if (tableId) {
        await tx.diningTable.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      // Update active cash shift
      const activeShift = await tx.cashShift.findFirst({
        where: { cafeId, status: 'OPEN' },
      });

      if (activeShift) {
        if (paymentMethod === 'CASH') {
          await tx.cashShift.update({
            where: { id: activeShift.id },
            data: { cashSales: { increment: totalAmount } },
          });
        } else if (paymentMethod === 'UPI') {
          await tx.cashShift.update({
            where: { id: activeShift.id },
            data: { upiSales: { increment: totalAmount } },
          });
        } else if (paymentMethod === 'CARD') {
          await tx.cashShift.update({
            where: { id: activeShift.id },
            data: { cardSales: { increment: totalAmount } },
          });
        }
      }

      // Recipe-Based Deduction from Inventory
      const recipes = await tx.recipeIngredient.findMany({
        where: { menuItemId: { in: menuItemIds } },
        include: { inventoryItem: true },
      });

      for (const item of items) {
        if (!item.menuItemId) continue;
        const itemRecipes = recipes.filter((r) => r.menuItemId === item.menuItemId);
        for (const recipe of itemRecipes) {
          const deductQuantity = recipe.quantity * Number(item.quantity);
          const currentStock = recipe.inventoryItem.currentStock;
          const updatedStock = Math.max(0, currentStock - deductQuantity);
          const isLow = updatedStock <= recipe.inventoryItem.minStock;

          await tx.inventoryItem.update({
            where: { id: recipe.inventoryItemId },
            data: {
              currentStock: updatedStock,
              isLowStock: isLow,
            },
          });

          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: recipe.inventoryItemId,
              type: 'USAGE',
              quantity: -deductQuantity,
              unit: recipe.unit,
              reason: `Consumed in POS order ${orderNumber}`,
              referenceId: createdOrder.id,
              cost: deductQuantity * recipe.inventoryItem.costPerUnit,
              performedBy: session.name,
            },
          });
        }
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
