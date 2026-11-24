import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const [subscription, plans] = await Promise.all([
      prisma.subscription.findFirst({
        where: { cafeId, status: 'ACTIVE' },
        include: {
          plan: true,
          invoices: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.plan.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { monthlyPrice: 'asc' },
      }),
    ]);

    const [itemCount, tableCount, qrCount] = await Promise.all([
      prisma.menuItem.count({ where: { cafeId } }),
      prisma.diningTable.count({ where: { cafeId } }),
      prisma.qRCode.count({ where: { cafeId } }),
    ]);

    return NextResponse.json({
      success: true,
      currentSubscription: subscription,
      availablePlans: plans,
      usage: {
        items: itemCount,
        tables: tableCount,
        qrCodes: qrCount,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const { planId, billingInterval = 'MONTHLY' } = await req.json();

    const targetPlan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!targetPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const amount = billingInterval === 'YEARLY' ? targetPlan.yearlyPrice : targetPlan.monthlyPrice;
    const endDate = new Date();
    if (billingInterval === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const newSub = await prisma.$transaction(async (tx) => {
      // Deactivate old active subscriptions
      await tx.subscription.updateMany({
        where: { cafeId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const sub = await tx.subscription.create({
        data: {
          cafeId,
          planId: targetPlan.id,
          status: 'ACTIVE',
          billingInterval,
          startDate: new Date(),
          endDate,
        },
        include: { plan: true },
      });

      const invNum = `INV-SUB-${Date.now().toString().slice(-6)}`;
      await tx.subscriptionInvoice.create({
        data: {
          subscriptionId: sub.id,
          amount,
          status: 'PAID',
          invoiceNumber: invNum,
        },
      });

      return sub;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${targetPlan.name} plan!`,
      subscription: newSub,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Subscription upgrade failed' }, { status: 500 });
  }
}
