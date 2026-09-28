'use server';

import { redirect } from 'next/navigation';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const str = (fd, k, max = 500) => String(fd.get(k) ?? '').trim().slice(0, max);
const num = (fd, k, fallback = 0) => {
  const v = fd.get(k);
  if (v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (fd, k) => fd.get(k) === 'on' || fd.get(k) === 'true';

// ─── BANNERS ───
export async function saveBanner(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/homepage');

  const id = str(formData, 'id') || null;

  const payload = {
    title: str(formData, 'title', 200) || null,
    subtitle: str(formData, 'subtitle', 300) || null,
    button_text: str(formData, 'button_text', 60) || null,
    button_link: str(formData, 'button_link', 300) || null,
    sort_order: num(formData, 'sort_order', 0),
    is_active: bool(formData, 'is_active'),
  };

  const service = createServiceClient();
  let bannerId = id;

  if (id) {
    const { error } = await service.from('banners').update(payload).eq('id', id);
    if (error) redirect(`/admin/homepage?tab=banners&error=${encodeURIComponent(error.message)}`);
  } else {
    const { data: created, error } = await service.from('banners').insert(payload).select('id').single();
    if (error) redirect(`/admin/homepage?tab=banners&error=${encodeURIComponent(error.message)}`);
    bannerId = created.id;
  }

  // Handle image upload if a file was provided
  const file = formData.get('image');
  if (file && typeof file !== 'string' && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      redirect(`/admin/homepage?tab=banners&error=${encodeURIComponent('Banner image is too large (max 5MB).')}`);
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      redirect(`/admin/homepage?tab=banners&error=${encodeURIComponent('Only JPG, PNG, or WebP allowed.')}`);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${bannerId}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Remove old image if replacing
    if (id) {
      const { data: existing } = await service.from('banners').select('storage_path').eq('id', id).maybeSingle();
      if (existing?.storage_path) {
        await service.storage.from('banners').remove([existing.storage_path]);
      }
    }

    const { error: upErr } = await service.storage
      .from('banners')
      .upload(filename, bytes, { contentType: file.type, upsert: true });

    if (upErr) {
      redirect(`/admin/homepage?tab=banners&error=${encodeURIComponent(upErr.message)}`);
    }

    const { data: pub } = service.storage.from('banners').getPublicUrl(filename);
    await service.from('banners').update({ image_url: pub.publicUrl, storage_path: filename }).eq('id', bannerId);
  }

  revalidateTag('store');
  revalidatePath('/admin/homepage');
  revalidatePath('/');
  redirect('/admin/homepage?tab=banners&message=' + encodeURIComponent('Banner saved.'));
}

export async function deleteBanner(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/homepage');

  const id = str(formData, 'id');
  if (!id) redirect('/admin/homepage?tab=banners');

  const service = createServiceClient();
  const { data: banner } = await service.from('banners').select('storage_path').eq('id', id).maybeSingle();

  if (banner?.storage_path) {
    await service.storage.from('banners').remove([banner.storage_path]);
  }

  await service.from('banners').delete().eq('id', id);

  revalidateTag('store');
  revalidatePath('/admin/homepage');
  revalidatePath('/');
  redirect('/admin/homepage?tab=banners&message=' + encodeURIComponent('Banner deleted.'));
}

export async function deleteBannerImage(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/homepage');

  const id = str(formData, 'id');
  const service = createServiceClient();

  const { data: banner } = await service.from('banners').select('storage_path').eq('id', id).maybeSingle();
  if (banner?.storage_path) {
    await service.storage.from('banners').remove([banner.storage_path]);
  }
  await service.from('banners').update({ image_url: null, storage_path: null }).eq('id', id);

  revalidateTag('store');
  revalidatePath('/admin/homepage');
  revalidatePath('/');
  redirect('/admin/homepage?tab=banners&message=' + encodeURIComponent('Banner image removed.'));
}

// ─── FEATURED / POPULAR ───
export async function updateFeaturedPopular(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/homepage');

  const mode = str(formData, 'mode'); // 'featured' or 'popular'
  if (!['featured', 'popular'].includes(mode)) redirect('/admin/homepage');

  // Read all product ids from form
  const allIds = JSON.parse(str(formData, 'all_ids', 20000) || '[]');
  const selectedIds = new Set(formData.getAll('selected').map(String));

  const service = createServiceClient();

  // For each product, set featured/popular + its order
  const updates = allIds.map((pid, index) => ({
    id: pid,
    [mode === 'featured' ? 'is_featured' : 'is_popular']: selectedIds.has(pid),
    [mode === 'featured' ? 'featured_order' : 'popular_order']: selectedIds.has(pid) ? index : 0,
  }));

  // Batch update: do it in a few parallel queries
  await Promise.all(
    updates.map((u) =>
      service
        .from('products')
        .update({
          [mode === 'featured' ? 'is_featured' : 'is_popular']: u[mode === 'featured' ? 'is_featured' : 'is_popular'],
          [mode === 'featured' ? 'featured_order' : 'popular_order']: u[mode === 'featured' ? 'featured_order' : 'popular_order'],
        })
        .eq('id', u.id)
    )
  );

  revalidateTag('store');
  revalidatePath('/admin/homepage');
  revalidatePath('/');
  redirect(`/admin/homepage?tab=${mode}&message=${encodeURIComponent('Saved.')}`);
}
