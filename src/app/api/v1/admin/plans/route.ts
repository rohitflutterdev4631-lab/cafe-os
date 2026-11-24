import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req, ['SUPER_ADMIN']);
    const body = await req.json();
    const { id, monthlyPrice, yearlyPrice, itemLimit, tableLimit, branchLimit, hasOnlineOrdering, hasCustomBranding } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        ...(monthlyPrice !== undefined && { monthlyPrice: Number(monthlyPrice) }),
        ...(yearlyPrice !== undefined && { yearlyPrice: Number(yearlyPrice) }),
        ...(itemLimit !== undefined && { itemLimit: Number(itemLimit) }),
        ...(tableLimit !== undefined && { tableLimit: Number(tableLimit) }),
        ...(branchLimit !== undefined && { branchLimit: Number(branchLimit) }),
        ...(hasOnlineOrdering !== undefined && { hasOnlineOrdering: Boolean(hasOnlineOrdering) }),
        ...(hasCustomBranding !== undefined && { hasCustomBranding: Boolean(hasCustomBranding) }),
      },
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
