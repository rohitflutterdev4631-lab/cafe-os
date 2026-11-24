import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils';
import { createRazorpayOrder, getActiveRazorpayCredentials } from '@/lib/razorpay';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { slug: params.slug },
      include: {
        settings: true,
        branches: { where: { isMain: true } },
      },
    });

    if (!cafe || cafe.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cafe not found or closed' }, { status: 404 });
    }

    if (cafe.settings && !cafe.settings.orderingEnabled) {
      return NextResponse.json(
        { error: 'Online ordering is currently disabled for this cafe' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      orderType = 'DINE_IN',
      tableNumber,
      deliveryAddress,
      notes,
      items,
      couponCode,
      paymentMethod = 'COUNTER',
      idempotencyKey,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Please add items to place an order.' },
        { status: 400 }
      );
    }

    // Check Idempotency Key
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: { include: { addons: true } } },
      });
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: 'Order retrieved via idempotency key',
          order: existingOrder,
        });
      }
    }

    // ----------------------------------------------------
    // SERVER-SIDE PRICE RECALCULATION & VALIDATION
    // ----------------------------------------------------
    const menuItemIds = items.map((i: any) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        cafeId: cafe.id,
      },
      include: {
        variants: true,
        menuItemAddonGroups: {
          include: {
            addonGroup: {
              include: { options: true },
            },
          },
        },
      },
    });

    const menuItemsMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    let calculatedSubtotal = 0;
    const validatedOrderItems: any[] = [];

    for (const item of items) {
      const dbItem = menuItemsMap.get(item.menuItemId);

      if (!dbItem) {
        return NextResponse.json(
          { error: `Item "${item.name || 'Unknown'}" is not part of this cafe's menu.` },
          { status: 400 }
        );
      }

      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { error: `"${dbItem.name}" is currently sold out and cannot be ordered.` },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));

      // Calculate unit price from base item or selected variant
      let unitPrice = dbItem.basePrice;
      let selectedVariantName: string | null = null;

      if (item.variant && item.variant.id) {
        const dbVariant = dbItem.variants.find((v) => v.id === item.variant.id);
        if (dbVariant) {
          unitPrice = dbVariant.price;
          selectedVariantName = dbVariant.name;
        }
      }

      // Calculate add-on options from database records
      let addonsTotalPrice = 0;
      const validatedAddons: { addonName: string; price: number }[] = [];

      if (item.addons && Array.isArray(item.addons)) {
        for (const addon of item.addons) {
          // Lookup option in dbItem's addon groups
          let matchedOption: { name: string; price: number } | null = null;
          for (const ag of dbItem.menuItemAddonGroups) {
            const opt = ag.addonGroup.options.find((o) => o.id === addon.id || o.name === addon.name);
            if (opt && opt.isAvailable) {
              matchedOption = opt;
              break;
            }
          }

          if (matchedOption) {
            addonsTotalPrice += matchedOption.price;
            validatedAddons.push({
              addonName: matchedOption.name,
              price: matchedOption.price,
            });
          }
        }
      }

      const itemEffectiveUnitPrice = unitPrice + addonsTotalPrice;
      const itemSubtotalPrice = itemEffectiveUnitPrice * quantity;
      calculatedSubtotal += itemSubtotalPrice;

      validatedOrderItems.push({
        menuItemId: dbItem.id,
        itemName: dbItem.name,
        variantName: selectedVariantName,
        quantity,
        unitPrice: itemEffectiveUnitPrice,
        subtotalPrice: itemSubtotalPrice,
        addons: validatedAddons,
      });
    }

    // Minimum order value check
    const minOrderVal = cafe.settings?.minOrderValue || 0;
    if (calculatedSubtotal < minOrderVal) {
      return NextResponse.json(
        { error: `Minimum order value for this cafe is ₹${minOrderVal}` },
        { status: 400 }
      );
    }

    // Coupon Discount calculation
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: {
          cafeId_code: {
            cafeId: cafe.id,
            code: couponCode.toUpperCase().trim(),
          },
        },
      });

      if (coupon && coupon.isActive && calculatedSubtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (calculatedSubtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    // Tax (GST) & Packaging calculation
    const taxRate = cafe.settings?.taxRatePercent || 0;
    const packagingFee =
      orderType === 'TAKEAWAY' || orderType === 'DELIVERY'
        ? cafe.settings?.packagingFee || 0
        : 0;

    const taxableAmount = Math.max(0, calculatedSubtotal - discountAmount);
    const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount + packagingFee) * 100) / 100;

    // Find table if dine-in
    let tableId: string | null = null;
    if (orderType === 'DINE_IN' && tableNumber) {
      const diningTable = await prisma.diningTable.findFirst({
        where: {
          cafeId: cafe.id,
          tableNumber,
        },
      });
      if (diningTable) {
        tableId = diningTable.id;
      }
    }

    // Unique order number
    let orderNumber = generateOrderNumber('NC');
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber('NC');
    }

    // Auto-upsert Customer
    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
        },
      });
    }

    const branchId = cafe.branches[0]?.id || null;

    // Execute order creation in transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          cafeId: cafe.id,
          branchId,
          customerId: customer.id,
          tableId,
          orderNumber,
          orderType,
          tableNumber: tableNumber || null,
          deliveryAddress: deliveryAddress || null,
          status: 'PENDING',
          subtotal: calculatedSubtotal,
          taxAmount,
          packagingFee,
          discountAmount,
          totalAmount,
          paymentStatus: paymentMethod === 'RAZORPAY' ? 'PENDING' : 'PENDING',
          paymentMethod,
          notes: notes || null,
          customerName,
          customerPhone,
          idempotencyKey: idempotencyKey || null,
          items: {
            create: validatedOrderItems.map((vi) => ({
              menuItemId: vi.menuItemId,
              itemName: vi.itemName,
              variantName: vi.variantName,
              quantity: vi.quantity,
              unitPrice: vi.unitPrice,
              subtotalPrice: vi.subtotalPrice,
              addons: {
                create: vi.addons.map((ad: any) => ({
                  addonName: ad.addonName,
                  price: ad.price,
                })),
              },
            })),
          },
          statusHistory: {
            create: [
              {
                oldStatus: null,
                newStatus: 'PENDING',
                changedBy: 'Customer',
                note: `Order placed via digital menu (${orderType})`,
              },
            ],
          },
        },
        include: {
          items: { include: { addons: true } },
          statusHistory: true,
        },
      });

      // If dine-in, mark table occupied
      if (tableId) {
        await tx.diningTable.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      return ord;
    });

    // If Razorpay payment chosen, create gateway order
    let razorpayOrderData: any = null;
    if (paymentMethod === 'RAZORPAY') {
      razorpayOrderData = await createRazorpayOrder({
        amount: totalAmount,
        receipt: createdOrder.orderNumber,
        notes: {
          orderId: createdOrder.id,
          cafeSlug: cafe.slug,
          orderNumber: createdOrder.orderNumber,
        },
      });

      await prisma.payment.create({
        data: {
          orderId: createdOrder.id,
          amount: totalAmount,
          method: 'RAZORPAY',
          status: 'PENDING',
          razorpayOrderId: razorpayOrderData.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: createdOrder,
      razorpay: razorpayOrderData
        ? {
            orderId: razorpayOrderData.id,
            amount: razorpayOrderData.amount,
            currency: razorpayOrderData.currency,
            keyId: getActiveRazorpayCredentials().keyId,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Customer place order error:', error);
    return NextResponse.json(
      { error: 'Failed to place order. Please try again.' },
      { status: 500 }
    );
  }
}
