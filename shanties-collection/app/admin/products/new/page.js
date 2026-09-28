import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductForm from '../_components/ProductForm';

export const metadata = { title: 'New product — Admin' };

export default async function NewProductPage({ searchParams }) {
  const supabase = createClient();

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('subcategories').select('id, name, category_id').eq('is_active', true).order('sort_order'),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/products" style={{ color: '#888', fontSize: '.9rem' }}>← Back to products</Link>
        <h1 style={{ margin: '.5rem 0 0 0' }}>New product</h1>
      </div>

      {searchParams?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{searchParams.error}</p>
      )}

      <ProductForm
        product={null}
        categories={categories || []}
        subcategories={subcategories || []}
        mode="new"
      />
    </div>
  );
}
