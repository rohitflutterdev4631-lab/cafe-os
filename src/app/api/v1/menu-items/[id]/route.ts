import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: params.id },
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

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const existing = await prisma.menuItem.findUnique({
      where: { id: params.id },
    });

    if (!existing || (existing.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.menuItem.update({
      where: { id: params.id },
      data: {
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.basePrice !== undefined && { basePrice: Number(body.basePrice) }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.foodType && { foodType: body.foodType }),
        ...(body.isAvailable !== undefined && { isAvailable: Boolean(body.isAvailable) }),
        ...(body.preparationMinutes !== undefined && { preparationMinutes: Number(body.preparationMinutes) }),
        ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
        ...(body.isBestseller !== undefined && { isBestseller: Boolean(body.isBestseller) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
      include: {
        category: true,
        variants: true,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const existing = await prisma.menuItem.findUnique({
      where: { id: params.id },
    });

    if (!existing || (existing.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    await prisma.menuItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
