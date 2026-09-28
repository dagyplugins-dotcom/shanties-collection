'use server';

import { redirect } from 'next/navigation';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { scSlugify } from '@/lib/utils';

const str = (fd, k, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);
const num = (fd, k, fallback = 0) => {
  const v = fd.get(k);
  if (v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (fd, k) => fd.get(k) === 'on' || fd.get(k) === 'true';

// ─── CATEGORIES ───
export async function saveCategory(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/categories');

  const id = str(formData, 'id') || null;
  const name = str(formData, 'name');
  if (!name) redirect('/admin/categories?error=' + encodeURIComponent('Category name is required.'));

  const payload = {
    name,
    slug: str(formData, 'slug', 200) || scSlugify(name),
    description: str(formData, 'description', 500) || null,
    sort_order: num(formData, 'sort_order', 0),
    is_active: bool(formData, 'is_active'),
  };

  const service = createServiceClient();
  if (id) {
    const { error } = await service.from('categories').update(payload).eq('id', id);
    if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await service.from('categories').insert(payload);
    if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag('store');
  revalidatePath('/admin/categories');
  revalidatePath('/categories');
  revalidatePath('/');
  redirect('/admin/categories?message=' + encodeURIComponent('Category saved.'));
}

export async function deleteCategory(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/categories');

  const id = str(formData, 'id');
  if (!id) redirect('/admin/categories');

  const service = createServiceClient();
  // Check for products using this category
  const { count } = await service
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if ((count || 0) > 0) {
    redirect(`/admin/categories?error=${encodeURIComponent('Cannot delete: ' + count + ' product(s) still use this category. Deactivate it instead.')}`);
  }

  await service.from('categories').delete().eq('id', id);

  revalidateTag('store');
  revalidatePath('/admin/categories');
  revalidatePath('/categories');
  redirect('/admin/categories?message=' + encodeURIComponent('Category deleted.'));
}

// ─── SUBCATEGORIES ───
export async function saveSubcategory(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/categories');

  const id = str(formData, 'id') || null;
  const category_id = str(formData, 'category_id');
  const name = str(formData, 'name');

  if (!category_id) redirect('/admin/categories?error=' + encodeURIComponent('Missing parent category.'));
  if (!name) redirect('/admin/categories?error=' + encodeURIComponent('Subcategory name is required.'));

  const payload = {
    category_id,
    name,
    slug: str(formData, 'slug', 200) || scSlugify(name),
    sort_order: num(formData, 'sort_order', 0),
    is_active: bool(formData, 'is_active'),
  };

  const service = createServiceClient();
  if (id) {
    const { error } = await service.from('subcategories').update(payload).eq('id', id);
    if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await service.from('subcategories').insert(payload);
    if (error) redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag('store');
  revalidatePath('/admin/categories');
  revalidatePath('/categories');
  redirect('/admin/categories?message=' + encodeURIComponent('Subcategory saved.'));
}

export async function deleteSubcategory(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/categories');

  const id = str(formData, 'id');
  if (!id) redirect('/admin/categories');

  const service = createServiceClient();
  const { count } = await service
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('subcategory_id', id);

  if ((count || 0) > 0) {
    redirect(`/admin/categories?error=${encodeURIComponent('Cannot delete: ' + count + ' product(s) still use this subcategory.')}`);
  }

  await service.from('subcategories').delete().eq('id', id);

  revalidateTag('store');
  revalidatePath('/admin/categories');
  redirect('/admin/categories?message=' + encodeURIComponent('Subcategory deleted.'));
}
