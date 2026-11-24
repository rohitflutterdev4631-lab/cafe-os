import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const importItem = await prisma.menuImportItem.findUnique({
      where: { id: params.itemId },
      include: { import: true },
    });

    if (!importItem || importItem.importId !== params.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importItem.import.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      extractedPrice,
      importCategoryId,
      isVeg,
      foodType,
      isAvailable,
      preparationMinutes,
      isBestseller,
      reviewStatus,
      reviewRequired,
      duplicateAction,
      variants,
      addons,
    } = body;

    const price =
      extractedPrice !== undefined
        ? typeof extractedPrice === 'number'
          ? extractedPrice
          : parseFloat(extractedPrice) || 0
        : undefined;

    // Update item
    const updated = await prisma.menuImportItem.update({
      where: { id: params.itemId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        extractedPrice: price,
        importCategoryId: importCategoryId !== undefined ? importCategoryId : undefined,
        isVeg: typeof isVeg === 'boolean' ? isVeg : undefined,
        foodType: foodType !== undefined ? foodType : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        preparationMinutes: typeof preparationMinutes === 'number' ? preparationMinutes : undefined,
        isBestseller: isBestseller !== undefined ? isBestseller : undefined,
        reviewStatus: reviewStatus !== undefined ? reviewStatus : undefined,
        reviewRequired: reviewRequired !== undefined ? reviewRequired : false,
        duplicateAction: duplicateAction !== undefined ? duplicateAction : undefined,
        manuallyEdited: true,
      },
    });

    // Replace variants if array provided
    if (Array.isArray(variants)) {
      await prisma.menuImportVariant.deleteMany({ where: { importItemId: params.itemId } });
      if (variants.length > 0) {
        await prisma.menuImportVariant.createMany({
          data: variants.map((v: any) => ({
            importItemId: params.itemId,
            name: v.name,
            price: typeof v.price === 'number' ? v.price : parseFloat(v.price) || 0,
            isDefault: !!v.isDefault,
          })),
        });
      }
    }

    // Replace addons if array provided
    if (Array.isArray(addons)) {
      await prisma.menuImportAddon.deleteMany({ where: { importItemId: params.itemId } });
      if (addons.length > 0) {
        await prisma.menuImportAddon.createMany({
          data: addons.map((a: any) => ({
            importItemId: params.itemId,
            name: a.name,
            price: typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0,
            groupName: a.groupName || 'Add-ons',
          })),
        });
      }
    }

    const fullItem = await prisma.menuImportItem.findUnique({
      where: { id: params.itemId },
      include: { variants: true, addons: true },
    });

    return NextResponse.json({
      success: true,
      data: fullItem,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const importItem = await prisma.menuImportItem.findUnique({
      where: { id: params.itemId },
      include: { import: true },
    });

    if (!importItem || importItem.importId !== params.id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importItem.import.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    await prisma.menuImportItem.delete({
      where: { id: params.itemId },
    });

    const totalItems = await prisma.menuImportItem.count({ where: { importId: params.id } });
    await prisma.menuImport.update({
      where: { id: params.id },
      data: { totalItems },
    });

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
