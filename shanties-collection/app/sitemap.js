import { getSitemapData } from '@/lib/data';
import { siteUrl } from '@/lib/utils';
import { INFO_PAGES } from '@/lib/pages';

export const revalidate = 3600;

export default async function sitemap() {
  const base = siteUrl();
  const { products, categories } = await getSitemapData();
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/categories`, changeFrequency: 'weekly', priority: 0.8 },
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: 'daily', priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly', priority: 0.7 })),
    ...Object.keys(INFO_PAGES).map((k) => ({ url: `${base}/${k}`, changeFrequency: 'yearly', priority: 0.3 })),
  ];
}
