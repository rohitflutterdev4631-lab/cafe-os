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

    const [customers, feedbacks] = await Promise.all([
      prisma.customer.findMany({
        include: {
          orders: {
            where: { cafeId },
            select: { id: true, orderNumber: true, totalAmount: true, createdAt: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: { orders: true, loyaltyTransactions: true },
          },
        },
        orderBy: { totalSpent: 'desc' },
      }),
      prisma.customerFeedback.findMany({
        where: { cafeId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Compute segment counts
    const segments = {
      vip: customers.filter((c) => c.tier === 'VIP').length,
      gold: customers.filter((c) => c.tier === 'GOLD').length,
      returning: customers.filter((c) => c.visitCount > 1).length,
      new: customers.filter((c) => c.visitCount <= 1).length,
    };

    return NextResponse.json({ success: true, customers, feedbacks, segments });
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
    const { action, customerId, points, notes, feedbackId, reply } = body;

    if (action === 'ADJUST_POINTS') {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
      }

      const diff = Number(points);
      const newPoints = Math.max(0, customer.loyaltyPoints + diff);

      // Recalculate tier
      let tier = customer.tier;
      if (newPoints >= 500) tier = 'VIP';
      else if (newPoints >= 250) tier = 'GOLD';
      else if (newPoints >= 100) tier = 'SILVER';

      const updated = await prisma.$transaction(async (tx) => {
        const c = await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: newPoints, tier },
        });

        await tx.loyaltyTransaction.create({
          data: {
            customerId,
            cafeId,
            type: diff >= 0 ? 'EARN' : 'REDEEM',
            points: Math.abs(diff),
            notes: notes || 'Manual adjustment by manager',
          },
        });

        return c;
      });

      return NextResponse.json({ success: true, customer: updated });
    }

    if (action === 'REPLY_FEEDBACK') {
      const fb = await prisma.customerFeedback.update({
        where: { id: feedbackId },
        data: {
          managerReply: reply,
          status: 'REPLIED',
        },
      });

      return NextResponse.json({ success: true, feedback: fb });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
