import type { MetadataRoute } from 'next';

import { source } from '@/lib/source';

const siteUrl = 'https://loxa.dev';
const marketingRoutes = ['/', '/early-access'] as const;

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [...marketingRoutes, ...source.getPages().map((page) => page.url)].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
