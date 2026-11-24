import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { slug: params.slug },
      select: {
        name: true,
        description: true,
        logo: true,
        coverImage: true,
      },
    });

    if (!cafe) {
      return {
        title: 'Cafe Menu Not Found — CAFE OS',
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nordcafe.vercel.app';
    const pageUrl = `${appUrl}/c/${params.slug}`;

    return {
      title: `${cafe.name} — Interactive Digital Menu & Table Ordering`,
      description:
        cafe.description ||
        `Browse live digital menu, food variants, and place direct table orders for ${cafe.name}.`,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: `${cafe.name} — Digital Menu`,
        description:
          cafe.description || `Browse the live menu and order online from ${cafe.name}.`,
        url: pageUrl,
        siteName: 'CAFE OS',
        images: [
          {
            url: cafe.coverImage || cafe.logo || `${appUrl}/icon.png`,
            width: 1200,
            height: 630,
            alt: cafe.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cafe.name} — Digital Menu`,
        description: cafe.description || `Browse the live menu of ${cafe.name}.`,
        images: [cafe.coverImage || cafe.logo || `${appUrl}/icon.png`],
      },
    };
  } catch {
    return {
      title: 'Digital Menu — Nord Cafe',
    };
  }
}

export default function CustomerCafeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
