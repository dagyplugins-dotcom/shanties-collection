import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';
import { saveBanner } from './actions';
import BannerCard from './_components/BannerCard';
import ProductPicker from './_components/ProductPicker';

export const metadata = { title: 'Homepage — Admin' };

const TABS = [
  { key: 'banners', label: 'Banners' },
  { key: 'featured', label: 'Featured products' },
  { key: 'popular', label: 'Popular products' },
];

export default async function AdminHomepagePage({ searchParams }) {
  const resolvedSearch = await Promise.resolve(searchParams);
  const tab = resolvedSearch?.tab || 'banners';

  const supabase = createClient();

  const [{ data: banners }, { data: products }, { data: categories }] = await Promise.all([
    supabase.from('banners').select('*').order('sort_order').order('created_at'),
    supabase.from('products').select('id, name, price, is_featured, is_popular, category_id').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name'),
  ]);

  const categoryMap = {};
  (categories || []).forEach((c) => { categoryMap[c.id] = c.name; });

  const productRows = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    category_name: categoryMap[p.category_id] || '',
    price_display: formatKSh(p.price),
  }));

  const featuredIds = (products || []).filter((p) => p.is_featured).map((p) => p.id);
  const popularIds = (products || []).filter((p) => p.is_popular).map((p) => p.id);

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0' }}>Homepage</h1>

      {resolvedSearch?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{resolvedSearch.error}</p>
      )}
      {resolvedSearch?.message && (
        <p className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{resolvedSearch.message}</p>
      )}

      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/admin/homepage?tab=${t.key}`}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '.85rem', padding: '.4rem .85rem' }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === 'banners' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <section>
            <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Current banners</h2>
            {!banners || banners.length === 0 ? (
              <p style={{ color: '#888' }}>No banners yet. Add one on the right.</p>
            ) : (
              banners.map((b) => <BannerCard key={b.id} banner={b} />)
            )}
          </section>

          <aside className="admin-panel">
            <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Add banner</h2>
            <form action={saveBanner} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <label className="field">
                <span>Title</span>
                <input name="title" placeholder="NEW COLLECTION" className="input" />
              </label>

              <label className="field">
                <span>Subtitle</span>
                <input name="subtitle" placeholder="Discover our latest products" className="input" />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                <label className="field">
                  <span>Button text</span>
                  <input name="button_text" placeholder="Shop now" className="input" />
                </label>
                <label className="field">
                  <span>Button link</span>
                  <input name="button_link" placeholder="/categories" className="input" />
                </label>
              </div>

              <label className="field">
                <span>Sort order</span>
                <input name="sort_order" type="number" defaultValue="0" className="input" />
              </label>

              <label className="field">
                <span>Image (required for new banner)</span>
                <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required style={{ padding: '.4rem 0' }} />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <input type="checkbox" name="is_active" defaultChecked />
                Active (visible on homepage)
              </label>

              <button type="submit" className="btn btn-primary">Add banner</button>
            </form>
          </aside>
        </div>
      )}

      {tab === 'featured' && (
        <ProductPicker mode="featured" products={productRows} selectedIds={featuredIds} />
      )}

      {tab === 'popular' && (
        <ProductPicker mode="popular" products={productRows} selectedIds={popularIds} />
      )}
    </div>
  );
}
