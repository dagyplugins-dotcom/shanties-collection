import { siteUrl } from '@/lib/utils';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/cart', '/checkout', '/api/', '/auth/', '/login', '/register'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
