import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const importSession = await prisma.menuImport.findUnique({
      where: { id: params.id },
    });

    if (!importSession) {
      return NextResponse.json({ error: 'Import session not found' }, { status: 404 });
    }

    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importSession.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const {
      importCategoryId,
      name,
      description,
      extractedPrice,
      isVeg,
      foodType,
      isAvailable,
      preparationMinutes,
      isBestseller,
      variants,
      addons,
    } = body;

    if (!importCategoryId || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Category ID and Product Name are required' },
        { status: 400 }
      );
    }

    const category = await prisma.menuImportCategory.findUnique({
      where: { id: importCategoryId },
    });

    if (!category || category.importId !== params.id) {
      return NextResponse.json({ error: 'Target category does not exist in this import' }, { status: 400 });
    }

    const price = typeof extractedPrice === 'number' ? extractedPrice : parseFloat(extractedPrice) || 0;

    const newItem = await prisma.menuImportItem.create({
      data: {
        importId: params.id,
        importCategoryId,
        name: name.trim(),
        description: description?.trim() || null,
        extractedPrice: price,
        currency: importSession.currency,
        confidence: 1.0,
        sourcePage: 1,
        reviewStatus: 'APPROVED',
        reviewRequired: false,
        manuallyEdited: true,
        isVeg: typeof isVeg === 'boolean' ? isVeg : null,
        foodType: foodType || (isVeg ? 'VEG' : 'NON_VEG'),
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        preparationMinutes: preparationMinutes || 15,
        isBestseller: isBestseller || false,
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: any) => ({
            name: v.name,
            price: typeof v.price === 'number' ? v.price : parseFloat(v.price) || 0,
            isDefault: !!v.isDefault,
          })),
        } : undefined,
        addons: addons && addons.length > 0 ? {
          create: addons.map((a: any) => ({
            name: a.name,
            price: typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0,
            groupName: a.groupName || 'Add-ons',
          })),
        } : undefined,
      },
      include: {
        variants: true,
        addons: true,
      },
    });

    // Update totalItems count
    const totalItems = await prisma.menuImportItem.count({ where: { importId: params.id } });
    await prisma.menuImport.update({
      where: { id: params.id },
      data: { totalItems },
    });

    return NextResponse.json({
      success: true,
      data: newItem,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
