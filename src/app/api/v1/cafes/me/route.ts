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

    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      include: {
        settings: true,
        branches: {
          include: {
            businessHours: true,
          },
        },
        socialLinks: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
        _count: {
          select: {
            menuItems: true,
            categories: true,
            diningTables: true,
            orders: true,
            qrCodes: true,
          },
        },
      },
    });

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cafe });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch cafe' }, { status: 500 });
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
    const {
      name,
      slug,
      logo,
      coverImage,
      description,
      themeColor,
      secondaryColor,
      fontFamily,
      enableDarkMode,
      cardLayout,
      gstin,
      fssai,
    } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await prisma.cafe.findFirst({
        where: { slug, NOT: { id: cafeId } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Slug is already taken by another cafe' }, { status: 409 });
      }
    }

    const updated = await prisma.cafe.update({
      where: { id: cafeId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
        ...(description !== undefined && { description }),
        ...(themeColor && { themeColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(fontFamily && { fontFamily }),
        ...(enableDarkMode !== undefined && { enableDarkMode }),
        ...(cardLayout && { cardLayout }),
        ...(gstin !== undefined && { gstin }),
        ...(fssai !== undefined && { fssai }),
      },
    });

    return NextResponse.json({ success: true, cafe: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update cafe' }, { status: 500 });
  }
}
