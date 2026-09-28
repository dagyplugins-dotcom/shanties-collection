import { getPublicClient } from '@/lib/supabase/public';

export const PAGE_SIZE = 24;
const CARD =
  'id,name,slug,price,previous_price,stock_quantity,rating_avg,review_count,category_id,product_images(url,alt,sort_order,is_primary)';

function db() {
  const c = getPublicClient();
  if (!c) throw new Error('Supabase is not configured');
  return c;
}
function unwrap(res) {
  if (res.error) throw res.error;
  return res.data;
}
async function safe(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' || getPublicClient()) console.error('[data]', e?.message || e);
    return fallback;
  }
}
const clean = (s) => String(s || '').replace(/[%_,()*\\"'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

function applySort(q, sort) {
  switch (sort) {
    case 'newest': return q.order('created_at', { ascending: false });
    case 'price_asc': return q.order('price', { ascending: true });
    case 'price_desc': return q.order('price', { ascending: false });
    default:
      return q.order('is_featured', { ascending: false }).order('featured_order', { ascending: true }).order('created_at', { ascending: false });
  }
}

export const getSettings = () =>
  safe(async () => {
    const rows = unwrap(await db().from('admin_settings').select('key,value').eq('is_public', true));
    return Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
  }, {});

export const getCategories = () =>
  safe(async () => {
    const rows = unwrap(
      await db()
        .from('categories')
        .select('id,name,slug,description,image_url,sort_order,subcategories(id,name,slug,sort_order,is_active)')
        .eq('is_active', true)
        .order('sort_order')
    );
    return (rows || []).map((c) => ({
      ...c,
      subcategories: (c.subcategories || []).filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, []);

export const getHomepage = () =>
  safe(
    async () => {
      const sb = db();
      const [banners, featured, popular, sections] = await Promise.all([
        sb.from('banners').select('id,image_url,title,subtitle,button_text,button_link,sort_order').eq('is_active', true).order('sort_order'),
        sb.from('products').select(CARD).eq('is_active', true).eq('is_featured', true).order('featured_order').limit(12),
        sb.from('products').select(CARD).eq('is_active', true).eq('is_popular', true).order('popular_order').limit(12),
        sb.from('homepage_sections').select('*'),
      ]);
      return {
        banners: unwrap(banners) || [],
        featured: unwrap(featured) || [],
        popular: unwrap(popular) || [],
        sections: Object.fromEntries((unwrap(sections) || []).map((s) => [s.key, s])),
      };
    },
    { banners: [], featured: [], popular: [], sections: {} }
  );

export const getCategoryPage = (slug, { sub, sort, page = 1, min, max } = {}) =>
  safe(async () => {
    const sb = db();
    const cat = unwrap(
      await sb
        .from('categories')
        .select('id,name,slug,description,image_url,subcategories(id,name,slug,sort_order,is_active)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()
    );
    if (!cat) return null;
    cat.subcategories = (cat.subcategories || []).filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order);
    const activeSub = sub ? cat.subcategories.find((s) => s.slug === sub) || null : null;

    let q = sb.from('products').select(CARD, { count: 'exact' }).eq('is_active', true).eq('category_id', cat.id);
    if (activeSub) q = q.eq('subcategory_id', activeSub.id);
    if (min > 0) q = q.gte('price', min);
    if (max > 0) q = q.lte('price', max);
    q = applySort(q, sort);
    const from = (page - 1) * PAGE_SIZE;
    const res = await q.range(from, from + PAGE_SIZE - 1);
    if (res.error) throw res.error;
    return { category: cat, activeSub, products: res.data || [], total: res.count || 0 };
  }, null);

export const getProductBySlug = (slug) =>
  safe(async () => {
    const sb = db();
    const p = unwrap(
      await sb
        .from('products')
        .select('*,product_images(id,url,alt,sort_order,is_primary),category:categories(name,slug),subcategory:subcategories(name,slug)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()
    );
    if (!p) return null;
    p.product_images = [...(p.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
    const reviews = unwrap(
      await sb.from('reviews').select('id,author_name,rating,comment,created_at').eq('product_id', p.id).eq('is_approved', true).order('created_at', { ascending: false }).limit(20)
    );
    return { product: p, reviews: reviews || [] };
  }, null);

export const getRelated = (categoryId, excludeId) =>
  safe(async () => {
    if (!categoryId) return [];
    return unwrap(await db().from('products').select(CARD).eq('is_active', true).eq('category_id', categoryId).neq('id', excludeId).limit(4)) || [];
  }, []);

export const searchProducts = (query, page = 1) =>
  safe(
    async () => {
      const sb = db();
      const tokens = clean(query).toLowerCase().split(' ').filter(Boolean).slice(0, 5);
      if (!tokens.length) return { products: [], total: 0 };

      // Categories / subcategories whose names match any token (so "shoes" finds everything in Shoes).
      const nameOr = tokens.map((t) => `name.ilike.%${t}%`).join(',');
      const [cats, subs] = await Promise.all([
        sb.from('categories').select('id,name').eq('is_active', true).or(nameOr),
        sb.from('subcategories').select('id,name').eq('is_active', true).or(nameOr),
      ]);
      const catRows = unwrap(cats) || [];
      const subRows = unwrap(subs) || [];

      let q = sb.from('products').select(CARD, { count: 'exact' }).eq('is_active', true);
      // Every word must match somewhere (name, keywords, description, category or subcategory).
      for (const t of tokens) {
        const parts = [`name.ilike.%${t}%`, `keywords.ilike.%${t}%`, `description.ilike.%${t}%`];
        const cIds = catRows.filter((c) => c.name.toLowerCase().includes(t)).map((c) => c.id);
        const sIds = subRows.filter((s) => s.name.toLowerCase().includes(t)).map((s) => s.id);
        if (cIds.length) parts.push(`category_id.in.(${cIds.join(',')})`);
        if (sIds.length) parts.push(`subcategory_id.in.(${sIds.join(',')})`);
        q = q.or(parts.join(','));
      }
      const from = (page - 1) * PAGE_SIZE;
      const res = await q.order('is_featured', { ascending: false }).order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
      if (res.error) throw res.error;
      return { products: res.data || [], total: res.count || 0 };
    },
    { products: [], total: 0 }
  );

export const suggest = (query) =>
  safe(
    async () => {
      const sb = db();
      const t = clean(query);
      if (t.length < 2) return { products: [], categories: [] };
      const [p, c, s] = await Promise.all([
        sb.from('products').select('name,slug').eq('is_active', true).or(`name.ilike.%${t}%,keywords.ilike.%${t}%`).limit(5),
        sb.from('categories').select('name,slug').eq('is_active', true).ilike('name', `%${t}%`).limit(2),
        sb.from('subcategories').select('name,slug,category:categories(slug)').eq('is_active', true).ilike('name', `%${t}%`).limit(3),
      ]);
      return {
        products: unwrap(p) || [],
        categories: [
          ...(unwrap(c) || []).map((x) => ({ name: x.name, href: `/category/${x.slug}` })),
          ...(unwrap(s) || []).filter((x) => x.category?.slug).map((x) => ({ name: x.name, href: `/category/${x.category.slug}?sub=${x.slug}` })),
        ],
      };
    },
    { products: [], categories: [] }
  );

export const getSitemapData = () =>
  safe(async () => {
    const sb = db();
    const [p, c] = await Promise.all([
      sb.from('products').select('slug,updated_at').eq('is_active', true).limit(5000),
      sb.from('categories').select('slug').eq('is_active', true),
    ]);
    return { products: unwrap(p) || [], categories: unwrap(c) || [] };
  }, { products: [], categories: [] });
