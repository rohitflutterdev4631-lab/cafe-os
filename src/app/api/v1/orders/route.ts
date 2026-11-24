import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'KITCHEN_STAFF', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const orderType = searchParams.get('type');
    const table = searchParams.get('table');

    const where: any = { cafeId };

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (orderType && orderType !== 'ALL') {
      where.orderType = orderType;
    }
    if (table) {
      where.tableNumber = table;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { addons: true },
        },
        payment: true,
        invoice: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
