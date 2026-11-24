import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['SUPER_ADMIN', 'ADMIN_STAFF']);

    const [
      totalCafes,
      activeCafes,
      pendingCafes,
      suspendedCafes,
      totalOrders,
      subscriptions,
      recentCafes,
      recentOrders,
      completedOrdersAgg,
    ] = await Promise.all([
      prisma.cafe.count(),
      prisma.cafe.count({ where: { status: 'ACTIVE' } }),
      prisma.cafe.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.cafe.count({ where: { status: 'SUSPENDED' } }),
      prisma.order.count(),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
      prisma.cafe.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true, email: true, phone: true } },
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
          },
          _count: { select: { orders: true, menuItems: true } },
        },
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { cafe: { select: { name: true, slug: true } } },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
    ]);

    // Calculate MRR from active subscriptions
    let mrr = 0;
    for (const sub of subscriptions) {
      if (sub.billingInterval === 'MONTHLY') {
        mrr += sub.plan.monthlyPrice;
      } else if (sub.billingInterval === 'YEARLY') {
        mrr += Math.round(sub.plan.yearlyPrice / 12);
      }
    }

    // Platform gross merchandise value (GMV)
    const platformGmv = completedOrdersAgg._sum.totalAmount || 0;

    // Monthly signup & revenue trend mock/query
    const monthlyData = [
      { month: 'Jun', signups: 4, revenue: 1996 },
      { month: 'Jul', signups: 7, revenue: 3493 },
      { month: 'Aug', signups: 11, revenue: 5489 },
      { month: 'Sep', signups: 16, revenue: 7984 },
      { month: 'Oct', signups: 22, revenue: 10978 },
      { month: 'Nov', signups: Math.max(totalCafes, 28), revenue: mrr > 0 ? mrr : 14970 },
    ];

    return NextResponse.json({
      success: true,
      stats: {
        totalCafes,
        activeCafes,
        pendingCafes,
        suspendedCafes,
        totalSubscriptions: subscriptions.length,
        mrr,
        totalOrders,
        platformGmv,
      },
      monthlyData,
      recentCafes,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
