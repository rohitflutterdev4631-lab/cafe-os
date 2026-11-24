import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category || (category.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Category not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category || (category.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Category not found or unauthorized' }, { status: 404 });
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
