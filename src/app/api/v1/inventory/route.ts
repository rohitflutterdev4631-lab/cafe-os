import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const where: any = { cafeId };
    if (category) where.category = category;
    if (lowStockOnly) where.isLowStock = true;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        recipeIngredients: {
          include: {
            menuItem: { select: { id: true, name: true, basePrice: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Summary metrics
    const totalItems = items.length;
    const lowStockCount = items.filter((i) => i.currentStock <= i.minStock).length;
    const totalValuation = items.reduce((acc, i) => acc + i.currentStock * i.costPerUnit, 0);

    return NextResponse.json({
      success: true,
      items,
      metrics: {
        totalItems,
        lowStockCount,
        totalValuation: Math.round(totalValuation),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'CAFE_OWNER', 'CAFE_MANAGER']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const body = await req.json();
    const { name, sku, category, currentStock, minStock, maxStock, unit, costPerUnit, supplierId, expiryDate, batchNumber } = body;

    if (!name || !sku) {
      return NextResponse.json({ success: false, error: 'Name and SKU are required' }, { status: 400 });
    }

    const isLowStock = Number(currentStock) <= Number(minStock);

    const item = await prisma.inventoryItem.create({
      data: {
        cafeId,
        name,
        sku,
        category: category || 'BEANS',
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 5,
        maxStock: maxStock ? Number(maxStock) : null,
        unit: unit || 'GRAM',
        costPerUnit: Number(costPerUnit) || 0,
        supplierId: supplierId || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNumber: batchNumber || null,
        isLowStock,
      },
    });

    // Log initial stock movement
    if (Number(currentStock) > 0) {
      await prisma.inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          type: 'PURCHASE',
          quantity: Number(currentStock),
          unit: item.unit,
          reason: 'Initial stock intake',
          cost: Number(currentStock) * item.costPerUnit,
          performedBy: session.name,
        },
      });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'CAFE_OWNER', 'CAFE_MANAGER']);
    const body = await req.json();
    const { id, adjustment, reason, type = 'ADJUSTMENT' } = body;

    if (!id || adjustment === undefined) {
      return NextResponse.json({ success: false, error: 'Item ID and adjustment amount required' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const newStock = Math.max(0, item.currentStock + Number(adjustment));
    const isLowStock = newStock <= item.minStock;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: newStock,
          isLowStock,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: id,
          type,
          quantity: Number(adjustment),
          unit: item.unit,
          reason: reason || 'Stock adjustment',
          cost: Math.abs(Number(adjustment)) * item.costPerUnit,
          performedBy: session.name,
        },
      });

      if (type === 'WASTAGE') {
        await tx.stockWastage.create({
          data: {
            cafeId: item.cafeId,
            inventoryItemId: id,
            quantity: Math.abs(Number(adjustment)),
            unit: item.unit,
            reason: reason || 'Wastage reported',
            reportedBy: session.name,
            cost: Math.abs(Number(adjustment)) * item.costPerUnit,
          },
        });
      }

      return updatedItem;
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
