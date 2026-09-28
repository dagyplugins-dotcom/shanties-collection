import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductForm from '../_components/ProductForm';
import ImageUploader from '../_components/ImageUploader';

export const metadata = { title: 'Edit product — Admin' };

export default async function EditProductPage({ params, searchParams }) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams);
  const productId = resolvedParams?.id;

  if (!productId) notFound();

  const supabase = createClient();

  const [
    { data: product },
    { data: categories },
    { data: subcategories },
    { data: images },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', productId).maybeSingle(),
    supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('subcategories').select('id, name, category_id').eq('is_active', true).order('sort_order'),
    supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order'),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/products" style={{ color: '#888', fontSize: '.9rem' }}>← Back to products</Link>
        <h1 style={{ margin: '.5rem 0 0 0' }}>Edit product</h1>
        <p style={{ color: '#888', margin: '.25rem 0 0 0', fontSize: '.9rem' }}>/{product.slug}</p>
      </div>

      {resolvedSearch?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{resolvedSearch.error}</p>
      )}
      {resolvedSearch?.message && (
        <p className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{resolvedSearch.message}</p>
      )}

      <ProductForm
        product={product}
        categories={categories || []}
        subcategories={subcategories || []}
        mode="edit"
      />

      <ImageUploader productId={product.id} images={images || []} />
    </div>
  );
}
