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

    const tables = await prisma.diningTable.findMany({
      where: { cafeId },
      orderBy: { tableNumber: 'asc' },
      include: {
        qrCode: true,
        orders: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    // 1. Enforce Subscription Table Limit
    const activeSub = await prisma.subscription.findFirst({
      where: { cafeId, status: 'ACTIVE' },
      include: { plan: true },
    });

    const currentCount = await prisma.diningTable.count({ where: { cafeId } });
    const tableLimit = activeSub?.plan?.tableLimit ?? 5;

    if (currentCount >= tableLimit) {
      return NextResponse.json(
        {
          error: `Table limit reached (${currentCount}/${tableLimit}) for your plan. Please upgrade to Pro or Business to add more tables.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tableNumber, capacity = 4, branchId } = body;

    if (!tableNumber) {
      return NextResponse.json({ error: 'Table number is required' }, { status: 400 });
    }

    // Find main branch if not specified
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const mainBranch = await prisma.branch.findFirst({
        where: { cafeId, isMain: true },
      });
      targetBranchId = mainBranch?.id;
    }

    if (!targetBranchId) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 400 });
    }

    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

    // Check duplicate table number in branch
    const existing = await prisma.diningTable.findUnique({
      where: {
        branchId_tableNumber: {
          branchId: targetBranchId,
          tableNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Table ${tableNumber} already exists in this branch` },
        { status: 409 }
      );
    }

    const qrToken = `qr_${cafe.slug}_${tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`;

    // Create table & QR code
    const result = await prisma.$transaction(async (tx) => {
      const table = await tx.diningTable.create({
        data: {
          cafeId,
          branchId: targetBranchId,
          tableNumber,
          capacity: Number(capacity),
          status: 'AVAILABLE',
        },
      });

      const qr = await tx.qRCode.create({
        data: {
          cafeId,
          branchId: targetBranchId,
          tableId: table.id,
          type: 'TABLE',
          token: qrToken,
          targetUrl: `/c/${cafe.slug}?table=${encodeURIComponent(tableNumber)}`,
          status: 'ACTIVE',
        },
      });

      const updatedTable = await tx.diningTable.update({
        where: { id: table.id },
        data: { qrCodeId: qr.id },
        include: { qrCode: true },
      });

      return updatedTable;
    });

    return NextResponse.json({ success: true, table: result });
  } catch (error: any) {
    console.error('Create table error:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
