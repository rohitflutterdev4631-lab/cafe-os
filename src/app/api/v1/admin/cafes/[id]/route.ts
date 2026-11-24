import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req, ['SUPER_ADMIN', 'ADMIN_STAFF']);

    const cafe = await prisma.cafe.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        settings: true,
        branches: {
          include: {
            businessHours: true,
            diningTables: true,
          },
        },
        categories: {
          include: {
            menuItems: {
              include: { variants: true },
            },
          },
        },
        subscriptions: {
          include: { plan: true },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cafe });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to fetch cafe' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN_STAFF']);
    const body = await req.json();

    const allowedFields = ['name', 'status', 'description', 'themeColor', 'secondaryColor'];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedCafe = await prisma.cafe.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        cafeId: params.id,
        action: 'ADMIN_UPDATE_CAFE',
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, cafe: updatedCafe });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to update cafe' }, { status: 500 });
  }
}
