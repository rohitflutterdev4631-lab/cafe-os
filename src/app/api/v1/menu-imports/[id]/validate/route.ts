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
      include: {
        categories: {
          include: {
            items: {
              include: {
                variants: true,
              },
            },
          },
        },
      },
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

    const errors: string[] = [];
    const warnings: string[] = [];

    if (importSession.categories.length === 0) {
      errors.push('The menu contains no categories. Please add at least one category.');
    }

    let totalItems = 0;
    for (const cat of importSession.categories) {
      if (cat.items.length === 0) {
        warnings.push(`Category "${cat.name}" has 0 products.`);
      }

      for (const item of cat.items) {
        totalItems++;
        if (item.extractedPrice <= 0 && (!item.variants || item.variants.length === 0)) {
          errors.push(
            `Product "${item.name}" in category "${cat.name}" has a price of 0. Please set a valid price.`
          );
        }
        if (item.reviewRequired) {
          warnings.push(`Product "${item.name}" is marked as requiring manual review.`);
        }
      }
    }

    if (totalItems === 0) {
      errors.push('The menu contains no products to import.');
    }

    return NextResponse.json({
      success: true,
      isValid: errors.length === 0,
      errors,
      warnings,
      totalCategories: importSession.categories.length,
      totalItems,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Validate import error:', error);
    return NextResponse.json({ error: 'Failed to validate menu import' }, { status: 500 });
  }
}
