import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { slug: params.slug },
      include: {
        settings: true,
        branches: {
          where: { status: 'ACTIVE' },
          include: {
            businessHours: true,
            diningTables: {
              select: {
                id: true,
                tableNumber: true,
                capacity: true,
                status: true,
              },
            },
          },
        },
        socialLinks: true,
      },
    });

    if (!cafe || cafe.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cafe not found or inactive' }, { status: 404 });
    }

    // Determine if currently open based on today's weekday
    const todayDay = new Date().getDay();
    const mainBranch = cafe.branches[0];
    const todayHour = mainBranch?.businessHours.find((h) => h.weekday === todayDay);
    const isOpen = todayHour ? !todayHour.isClosed : true;

    return NextResponse.json(
      {
        success: true,
        cafe: {
          id: cafe.id,
          name: cafe.name,
          slug: cafe.slug,
          logo: cafe.logo,
          coverImage: cafe.coverImage,
          description: cafe.description,
          themeColor: cafe.themeColor,
          secondaryColor: cafe.secondaryColor,
          fontFamily: cafe.fontFamily,
          enableDarkMode: cafe.enableDarkMode,
          cardLayout: cafe.cardLayout,
          isOpen,
          todayHours: todayHour ? `${todayHour.openingTime} - ${todayHour.closingTime}` : 'Open Today',
          settings: cafe.settings,
          branches: cafe.branches.map((b) => ({
            id: b.id,
            name: b.name,
            address: b.address,
            phone: b.phone,
            tables: b.diningTables,
          })),
          socialLinks: cafe.socialLinks,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, s-maxage=300',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cafe profile' }, { status: 500 });
  }
}
