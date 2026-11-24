import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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
        cafe: {
          select: { id: true, name: true, slug: true, logo: true, settings: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        files: true,
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
              include: {
                variants: true,
                addons: true,
              },
            },
          },
        },
      },
    });

    if (!importSession) {
      return NextResponse.json({ error: 'Import session not found' }, { status: 404 });
    }

    // Tenant check
    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importSession.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Compute stats
    let totalItems = 0;
    let reviewRequiredCount = 0;
    let averageConfidence = 0;
    let confidenceSum = 0;

    for (const cat of importSession.categories) {
      for (const item of cat.items) {
        totalItems++;
        confidenceSum += item.confidence;
        if (item.reviewRequired || item.extractedPrice === 0) {
          reviewRequiredCount++;
        }
      }
    }

    if (totalItems > 0) {
      averageConfidence = Math.round((confidenceSum / totalItems) * 100) / 100;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...importSession,
        stats: {
          totalCategories: importSession.categories.length,
          totalItems,
          reviewRequiredCount,
          averageConfidence,
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get preview error:', error);
    return NextResponse.json({ error: 'Failed to retrieve extracted menu preview' }, { status: 500 });
  }
}
