import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'KITCHEN_STAFF', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { addons: true },
        },
        payment: true,
        invoice: true,
        cafe: {
          select: {
            name: true,
            slug: true,
            logo: true,
            gstin: true,
            fssai: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order || (order.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'KITCHEN_STAFF', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: { table: true },
    });

    if (!existing || (existing.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const { status, rejectionReason, note } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          status,
          ...(rejectionReason && { rejectionReason }),
          // If marked completed and payment was counter/cash, mark paid
          ...(status === 'COMPLETED' && existing.paymentStatus === 'PENDING' && {
            paymentStatus: 'PAID',
          }),
        },
        include: {
          items: { include: { addons: true } },
          payment: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      // 2. Record Status Transition History
      await tx.orderStatusHistory.create({
        data: {
          orderId: params.id,
          oldStatus: existing.status,
          newStatus: status,
          changedBy: `${session.name} (${session.role})`,
          note: note || (rejectionReason ? `Reason: ${rejectionReason}` : null),
        },
      });

      // 3. Update Table Status if applicable
      if (existing.tableId) {
        if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED') {
          // Check if any other active orders exist on this table
          const otherActive = await tx.order.count({
            where: {
              tableId: existing.tableId,
              id: { not: params.id },
              status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
            },
          });
          if (otherActive === 0) {
            await tx.diningTable.update({
              where: { id: existing.tableId },
              data: { status: 'AVAILABLE' },
            });
          }
        } else if (status === 'ACCEPTED' || status === 'PREPARING') {
          await tx.diningTable.update({
            where: { id: existing.tableId },
            data: { status: 'OCCUPIED' },
          });
        }
      }

      // 4. Generate Invoice on Completed if none exists
      if (status === 'COMPLETED') {
        const existingInvoice = await tx.invoice.findUnique({
          where: { orderId: params.id },
        });
        if (!existingInvoice) {
          const invNum = `INV-${new Date().getFullYear()}-${existing.orderNumber}`;
          await tx.invoice.create({
            data: {
              orderId: params.id,
              invoiceNumber: invNum,
              total: existing.totalAmount,
            },
          });
        }
      }

      return updatedOrder;
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error('Update order error:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
