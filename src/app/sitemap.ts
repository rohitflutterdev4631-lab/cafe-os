import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nordcafe.vercel.app';

  let cafeUrls: MetadataRoute.Sitemap = [];
  try {
    const cafes = await prisma.cafe.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });
    cafeUrls = cafes.map((cafe) => ({
      url: `${baseUrl}/c/${cafe.slug}`,
      lastModified: cafe.updatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    }));
  } catch {
    // Graceful fallback during static builds
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/lookup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...cafeUrls,
  ];
}
