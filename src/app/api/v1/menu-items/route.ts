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

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const where: any = { cafeId };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
      include: {
        category: true,
        variants: true,
        menuItemAddonGroups: {
          include: {
            addonGroup: {
              include: { options: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    // 1. Enforce Subscription Limits on backend
    const activeSub = await prisma.subscription.findFirst({
      where: { cafeId, status: 'ACTIVE' },
      include: { plan: true },
    });

    const currentCount = await prisma.menuItem.count({ where: { cafeId } });
    const itemLimit = activeSub?.plan?.itemLimit ?? 20;

    if (currentCount >= itemLimit) {
      return NextResponse.json(
        {
          error: `Item limit reached (${currentCount}/${itemLimit}) for your current plan (${activeSub?.plan?.name || 'Free'}). Please upgrade to add more items.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      categoryId,
      name,
      description,
      basePrice,
      image,
      foodType = 'VEG',
      preparationMinutes = 15,
      isFeatured = false,
      isBestseller = false,
      variants = [],
      addonGroupIds = [],
    } = body;

    if (!categoryId || !name || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Category ID, name, and base price are required' },
        { status: 400 }
      );
    }

    const newItem = await prisma.menuItem.create({
      data: {
        cafeId,
        categoryId,
        name,
        description: description || null,
        basePrice: Number(basePrice),
        image: image || null,
        foodType,
        preparationMinutes: Number(preparationMinutes),
        isFeatured: Boolean(isFeatured),
        isBestseller: Boolean(isBestseller),
        isAvailable: true,
        variants: {
          create: variants.map((v: any) => ({
            name: v.name,
            price: Number(v.price),
            isDefault: Boolean(v.isDefault),
          })),
        },
        menuItemAddonGroups: {
          create: addonGroupIds.map((groupId: string) => ({
            addonGroupId: groupId,
          })),
        },
      },
      include: {
        category: true,
        variants: true,
        menuItemAddonGroups: {
          include: { addonGroup: { include: { options: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error('Create item error:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
