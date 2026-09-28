'use server';

import { redirect } from 'next/navigation';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { scSlugify } from '@/lib/utils';

const num = (fd, k, fallback = null) => {
  const v = fd.get(k);
  if (v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (fd, k, max = 5000) => String(fd.get(k) ?? '').trim().slice(0, max);
const bool = (fd, k) => fd.get(k) === 'on' || fd.get(k) === 'true';

export async function saveProduct(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/products');

  const id = str(formData, 'id') || null;
  const name = str(formData, 'name', 200);
  if (!name) redirect(`/admin/products${id ? `/${id}` : '/new'}?error=${encodeURIComponent('Name is required.')}`);

  const payload = {
    name,
    slug: str(formData, 'slug', 200) || scSlugify(name),
    description: str(formData, 'description') || null,
    details: str(formData, 'details') || null,
    price: num(formData, 'price', 0),
    previous_price: num(formData, 'previous_price'),
    stock_quantity: num(formData, 'stock_quantity', 0),
    category_id: str(formData, 'category_id') || null,
    subcategory_id: str(formData, 'subcategory_id') || null,
    keywords: str(formData, 'keywords', 400) || null,
    is_featured: bool(formData, 'is_featured'),
    is_popular: bool(formData, 'is_popular'),
    is_active: bool(formData, 'is_active'),
  };

  if (id) {
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) redirect(`/admin/products/${id}?error=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await supabase.from('products').insert(payload);
    if (error) redirect(`/admin/products/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag('store');
  revalidatePath('/admin/products');
  revalidatePath('/');
  redirect('/admin/products?message=' + encodeURIComponent('Product saved.'));
}

export async function deleteProduct(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/products');

  const id = str(formData, 'id');
  if (!id) redirect('/admin/products');

  await supabase.from('products').delete().eq('id', id);
  revalidateTag('store');
  revalidatePath('/admin/products');
  redirect('/admin/products?message=' + encodeURIComponent('Product deleted.'));
}

// --- Product images ---
export async function uploadProductImage(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/products');

  const productId = str(formData, 'product_id');
  const file = formData.get('file');

  if (!productId || !file || typeof file === 'string') {
    redirect(`/admin/products/${productId}?error=${encodeURIComponent('No file selected.')}`);
  }

  const MAX = 5 * 1024 * 1024;
  if (file.size > MAX) {
    redirect(`/admin/products/${productId}?error=${encodeURIComponent('Image is too large (max 5MB).')}`);
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    redirect(`/admin/products/${productId}?error=${encodeURIComponent('Only JPG, PNG, or WebP are allowed.')}`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const service = createServiceClient();
  const { error: upErr } = await service.storage
    .from('products')
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (upErr) {
    redirect(`/admin/products/${productId}?error=${encodeURIComponent(upErr.message)}`);
  }

  const { data: pub } = service.storage.from('products').getPublicUrl(filename);

  // Is this the first image? If so, make it primary.
  const { count } = await service
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  await service.from('product_images').insert({
    product_id: productId,
    url: pub.publicUrl,
    storage_path: filename,
    alt: null,
    sort_order: (count || 0),
    is_primary: (count || 0) === 0,
  });

  revalidateTag('store');
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?message=${encodeURIComponent('Image uploaded.')}`);
}

export async function deleteProductImage(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/products');

  const imageId = str(formData, 'image_id');
  const productId = str(formData, 'product_id');

  const service = createServiceClient();
  const { data: img } = await service
    .from('product_images')
    .select('storage_path, is_primary')
    .eq('id', imageId)
    .maybeSingle();

  if (img?.storage_path) {
    await service.storage.from('products').remove([img.storage_path]);
  }

  await service.from('product_images').delete().eq('id', imageId);

  // If we deleted the primary, promote the next one
  if (img?.is_primary) {
    const { data: next } = await service
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order')
      .limit(1)
      .maybeSingle();
    if (next) await service.from('product_images').update({ is_primary: true }).eq('id', next.id);
  }

  revalidateTag('store');
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?message=${encodeURIComponent('Image deleted.')}`);
}

export async function setPrimaryImage(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/products');

  const imageId = str(formData, 'image_id');
  const productId = str(formData, 'product_id');

  const service = createServiceClient();
  await service.from('product_images').update({ is_primary: false }).eq('product_id', productId);
  await service.from('product_images').update({ is_primary: true }).eq('id', imageId);

  revalidateTag('store');
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?message=${encodeURIComponent('Primary image updated.')}`);
}

