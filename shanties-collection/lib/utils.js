export const formatKSh = (n) =>
  'KSh ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const discountPct = (price, prev) =>
  prev && Number(prev) > Number(price) ? Math.round((1 - Number(price) / Number(prev)) * 100) : 0;

export function primaryImage(p) {
  const imgs = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  return imgs.find((i) => i.is_primary) || imgs[0] || null;
}

export function stockInfo(qty) {
  if (qty <= 0) return { label: 'OUT OF STOCK', tone: 'out' };
  if (qty <= 5) return { label: `Only ${qty} left`, tone: 'low' };
  return { label: 'In stock', tone: 'in' };
}

// Only allow same-site relative redirects.
export function safeNext(n, fallback = '/account') {
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : fallback;
}

export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Kenyan mobile numbers -> 2547XXXXXXXX / 2541XXXXXXXX (the format M-Pesa expects). Returns null if invalid.
export function normalizePhone(input) {
  let d = String(input || '').replace(/[\s\-()]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (/^0[71]\d{8}$/.test(d)) d = '254' + d.slice(1);
  else if (/^[71]\d{8}$/.test(d)) d = '254' + d;
  return /^254[71]\d{8}$/.test(d) ? d : null;
}

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || ''));

// Convert a product name into a URL-safe slug
export function scSlugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
