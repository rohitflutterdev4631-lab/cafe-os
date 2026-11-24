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

    const pos = await prisma.purchaseOrder.findMany({
      where: { cafeId },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, purchaseOrders: pos });
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
    const { supplierId, items, notes, expectedDate } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Supplier and at least one item required' }, { status: 400 });
    }

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    const formattedItems = items.map((it: any) => {
      const lineCost = Number(it.quantity) * Number(it.unitCost);
      totalAmount += lineCost;
      return {
        inventoryItemId: it.inventoryItemId,
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
        totalCost: lineCost,
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        cafeId,
        supplierId,
        poNumber,
        status: 'DRAFT',
        totalAmount,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || null,
        items: {
          create: formattedItems,
        },
      },
      include: {
        supplier: true,
        items: { include: { inventoryItem: true } },
      },
    });

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'CAFE_OWNER', 'CAFE_MANAGER']);
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'PO ID and status required' }, { status: 400 });
    }

    const currentPo = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { inventoryItem: true } } },
    });

    if (!currentPo) {
      return NextResponse.json({ success: false, error: 'Purchase Order not found' }, { status: 404 });
    }

    // If changing to RECEIVED, restock inventory items!
    const result = await prisma.$transaction(async (tx) => {
      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status,
          receivedDate: status === 'RECEIVED' ? new Date() : currentPo.receivedDate,
        },
      });

      if (status === 'RECEIVED' && currentPo.status !== 'RECEIVED') {
        for (const line of currentPo.items) {
          // Increment inventory
          const inv = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
          if (inv) {
            const newStock = inv.currentStock + line.quantity;
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: {
                currentStock: newStock,
                isLowStock: newStock <= inv.minStock,
                costPerUnit: line.unitCost > 0 ? line.unitCost : inv.costPerUnit,
              },
            });

            await tx.inventoryMovement.create({
              data: {
                inventoryItemId: inv.id,
                type: 'PURCHASE',
                quantity: line.quantity,
                unit: inv.unit,
                reason: `Received from ${currentPo.poNumber}`,
                referenceId: currentPo.id,
                cost: line.totalCost,
                performedBy: session.name,
              },
            });
          }
        }
      }

      return updatedPo;
    });

    return NextResponse.json({ success: true, purchaseOrder: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
