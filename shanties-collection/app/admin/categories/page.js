import { createClient } from '@/lib/supabase/server';
import { saveCategory } from './actions';
import CategoryRow from './_components/CategoryRow';

export const metadata = { title: 'Categories — Admin' };

export default async function AdminCategoriesPage({ searchParams }) {
  const resolvedSearch = await Promise.resolve(searchParams);

  const supabase = createClient();

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('name'),
    supabase.from('subcategories').select('*').order('sort_order').order('name'),
  ]);

  const subsByCategory = {};
  (subcategories || []).forEach((s) => {
    if (!subsByCategory[s.category_id]) subsByCategory[s.category_id] = [];
    subsByCategory[s.category_id].push(s);
  });

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0' }}>Categories</h1>

      {resolvedSearch?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{resolvedSearch.error}</p>
      )}
      {resolvedSearch?.message && (
        <p className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{resolvedSearch.message}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        <section>
          <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>All categories</h2>
          {!categories || categories.length === 0 ? (
            <p style={{ color: '#888' }}>No categories yet. Add one on the right.</p>
          ) : (
            <div>
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} subcategories={subsByCategory[c.id] || []} />
              ))}
            </div>
          )}
        </section>

        <aside className="admin-panel">
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Add category</h2>
          <form action={saveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <label className="field">
              <span>Name *</span>
              <input name="name" required placeholder="e.g. Home & Kitchen" className="input" />
            </label>

            <label className="field">
              <span>Slug (optional)</span>
              <input name="slug" placeholder="auto-generated if blank" className="input" />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea name="description" rows="2" className="input" />
            </label>

            <label className="field">
              <span>Sort order</span>
              <input name="sort_order" type="number" defaultValue="0" className="input" />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input type="checkbox" name="is_active" defaultChecked />
              Active
            </label>

            <button type="submit" className="btn btn-primary">Add category</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
