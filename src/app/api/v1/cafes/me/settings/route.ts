import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const settings = await prisma.cafeSetting.findUnique({
      where: { cafeId },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.cafeSetting.upsert({
      where: { cafeId },
      update: {
        ...(body.currency && { currency: body.currency }),
        ...(body.currencySymbol && { currencySymbol: body.currencySymbol }),
        ...(body.timezone && { timezone: body.timezone }),
        ...(body.orderingEnabled !== undefined && { orderingEnabled: Boolean(body.orderingEnabled) }),
        ...(body.dineInEnabled !== undefined && { dineInEnabled: Boolean(body.dineInEnabled) }),
        ...(body.takeawayEnabled !== undefined && { takeawayEnabled: Boolean(body.takeawayEnabled) }),
        ...(body.deliveryEnabled !== undefined && { deliveryEnabled: Boolean(body.deliveryEnabled) }),
        ...(body.taxRatePercent !== undefined && { taxRatePercent: Number(body.taxRatePercent) }),
        ...(body.packagingFee !== undefined && { packagingFee: Number(body.packagingFee) }),
        ...(body.minOrderValue !== undefined && { minOrderValue: Number(body.minOrderValue) }),
        ...(body.autoAcceptOrders !== undefined && { autoAcceptOrders: Boolean(body.autoAcceptOrders) }),
        ...(body.soundNotifications !== undefined && { soundNotifications: Boolean(body.soundNotifications) }),
      },
      create: {
        cafeId,
        currency: body.currency || 'INR',
        currencySymbol: body.currencySymbol || '₹',
        taxRatePercent: body.taxRatePercent ? Number(body.taxRatePercent) : 5.0,
        packagingFee: body.packagingFee ? Number(body.packagingFee) : 0,
        orderingEnabled: body.orderingEnabled !== undefined ? Boolean(body.orderingEnabled) : true,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
