import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const importCat = await prisma.menuImportCategory.findUnique({
      where: { id: params.categoryId },
      include: { import: true },
    });

    if (!importCat || importCat.importId !== params.id) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importCat.import.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, sortOrder, reviewStatus } = body;

    const updated = await prisma.menuImportCategory.update({
      where: { id: params.categoryId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        reviewStatus: reviewStatus !== undefined ? reviewStatus : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const importCat = await prisma.menuImportCategory.findUnique({
      where: { id: params.categoryId },
      include: { import: true },
    });

    if (!importCat || importCat.importId !== params.id) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importCat.import.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    await prisma.menuImportCategory.delete({
      where: { id: params.categoryId },
    });

    // Update counts
    const [totalCategories, totalItems] = await Promise.all([
      prisma.menuImportCategory.count({ where: { importId: params.id } }),
      prisma.menuImportItem.count({ where: { importId: params.id } }),
    ]);

    await prisma.menuImport.update({
      where: { id: params.id },
      data: { totalCategories, totalItems },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
