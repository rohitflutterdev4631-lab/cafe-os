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
    const date = searchParams.get('date');

    const where: any = { cafeId };
    if (date) where.date = date;

    const [reservations, waitlist, tables] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: { table: { select: { id: true, tableNumber: true, capacity: true } } },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      }),
      prisma.waitlistEntry.findMany({
        where: { cafeId, status: { in: ['WAITING', 'NOTIFIED'] } },
        orderBy: { queueNumber: 'asc' },
      }),
      prisma.diningTable.findMany({
        where: { cafeId },
        select: { id: true, tableNumber: true, capacity: true, status: true },
        orderBy: { tableNumber: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, reservations, waitlist, tables });
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
    const { isWaitlist, customerName, customerPhone, customerEmail, guestCount, date, time, tableId, specialRequests, notes } = body;

    if (isWaitlist) {
      // Find max queue number for today
      const highest = await prisma.waitlistEntry.findFirst({
        where: { cafeId },
        orderBy: { queueNumber: 'desc' },
      });
      const nextQueue = (highest?.queueNumber || 0) + 1;

      const entry = await prisma.waitlistEntry.create({
        data: {
          cafeId,
          customerName,
          customerPhone,
          guestCount: Number(guestCount) || 2,
          queueNumber: nextQueue,
          status: 'WAITING',
          estimatedWaitMinutes: 15,
          notes: notes || null,
        },
      });

      return NextResponse.json({ success: true, waitlistEntry: entry });
    }

    if (!customerName || !customerPhone || !date || !time) {
      return NextResponse.json({ success: false, error: 'Name, phone, date, and time are required' }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        cafeId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        guestCount: Number(guestCount) || 2,
        date,
        time,
        tableId: tableId || null,
        status: 'CONFIRMED',
        specialRequests: specialRequests || null,
      },
      include: { table: true },
    });

    if (tableId) {
      await prisma.diningTable.update({
        where: { id: tableId },
        data: { status: 'RESERVED' },
      });
    }

    return NextResponse.json({ success: true, reservation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();
    const { id, type = 'reservation', status, tableId } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status required' }, { status: 400 });
    }

    if (type === 'waitlist') {
      const updated = await prisma.waitlistEntry.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, waitlistEntry: updated });
    }

    const res = await prisma.reservation.findUnique({ where: { id } });
    if (!res) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.update({
        where: { id },
        data: {
          status,
          tableId: tableId !== undefined ? tableId : res.tableId,
        },
        include: { table: true },
      });

      // Update table status if seated or completed
      const activeTableId = tableId || res.tableId;
      if (activeTableId) {
        if (status === 'SEATED') {
          await tx.diningTable.update({ where: { id: activeTableId }, data: { status: 'OCCUPIED' } });
        } else if (status === 'COMPLETED' || status === 'CANCELLED') {
          await tx.diningTable.update({ where: { id: activeTableId }, data: { status: 'AVAILABLE' } });
        }
      }

      return r;
    });

    return NextResponse.json({ success: true, reservation: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
