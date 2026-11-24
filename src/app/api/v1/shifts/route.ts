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

    const [activeShift, pastShifts] = await Promise.all([
      prisma.cashShift.findFirst({
        where: { cafeId, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      }),
      prisma.cashShift.findMany({
        where: { cafeId, status: { in: ['CLOSED', 'AUDITED'] } },
        orderBy: { openedAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({ success: true, activeShift, pastShifts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const body = await req.json();
    const { action, openingCash, closingCash, shiftType, notes } = body;

    if (action === 'OPEN') {
      // Check if there is already an open shift
      const existing = await prisma.cashShift.findFirst({ where: { cafeId, status: 'OPEN' } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'A shift is already open.' }, { status: 400 });
      }

      const shift = await prisma.cashShift.create({
        data: {
          cafeId,
          staffName: session.name,
          shiftType: shiftType || 'MORNING',
          openingCash: Number(openingCash) || 0,
          notes: notes || null,
        },
      });

      return NextResponse.json({ success: true, shift });
    }

    if (action === 'CLOSE') {
      const active = await prisma.cashShift.findFirst({ where: { cafeId, status: 'OPEN' } });
      if (!active) {
        return NextResponse.json({ success: false, error: 'No open shift found to close' }, { status: 400 });
      }

      const closedCash = Number(closingCash) || 0;
      const expectedCash = active.openingCash + active.cashSales;
      const difference = closedCash - expectedCash;

      const closed = await prisma.cashShift.update({
        where: { id: active.id },
        data: {
          status: 'CLOSED',
          closingCash: closedCash,
          expectedCash,
          cashDifference: difference,
          closedAt: new Date(),
          notes: notes ? `${active.notes ? active.notes + ' | ' : ''}${notes}` : active.notes,
        },
      });

      return NextResponse.json({ success: true, shift: closed });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Must be OPEN or CLOSE.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
