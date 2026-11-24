import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nordcafe.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/c/', '/lookup'],
        disallow: ['/admin/', '/dashboard/', '/kitchen/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
