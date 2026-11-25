import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { slug: params.slug },
      select: { id: true, status: true },
    });

    if (!cafe || cafe.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cafe not found or inactive' }, { status: 404 });
    }

    const categories = await prisma.category.findMany({
      where: {
        cafeId: cafe.id,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            variants: {
              orderBy: { price: 'asc' },
            },
            menuItemAddonGroups: {
              include: {
                addonGroup: {
                  include: {
                    options: {
                      where: { isAvailable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'CDN-Cache-Control': 'public, s-maxage=120',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
