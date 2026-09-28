'use server';

import { redirect } from 'next/navigation';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const str = (fd, k, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);
const num = (fd, k, fallback = 0) => {
  const v = fd.get(k);
  if (v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (fd, k) => fd.get(k) === 'on' || fd.get(k) === 'true';

export async function saveZone(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/delivery');

  const id = str(formData, 'id') || null;
  const county = str(formData, 'county');
  if (!county) redirect('/admin/delivery?error=' + encodeURIComponent('County is required.'));

  const payload = {
    county,
    town: str(formData, 'town') || null,
    fee: num(formData, 'fee', 0),
    eta: str(formData, 'eta') || null,
    is_enabled: bool(formData, 'is_enabled'),
    sort_order: num(formData, 'sort_order', 0),
  };

  const service = createServiceClient();
  if (id) {
    const { error } = await service.from('delivery_zones').update(payload).eq('id', id);
    if (error) redirect(`/admin/delivery?error=${encodeURIComponent(error.message)}`);
  } else {
    const { error } = await service.from('delivery_zones').insert(payload);
    if (error) redirect(`/admin/delivery?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag('store');
  revalidatePath('/admin/delivery');
  revalidatePath('/checkout');
  redirect('/admin/delivery?message=' + encodeURIComponent('Delivery zone saved.'));
}

export async function deleteZone(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/delivery');

  const id = str(formData, 'id');
  if (!id) redirect('/admin/delivery');

  const service = createServiceClient();
  await service.from('delivery_zones').delete().eq('id', id);

  revalidateTag('store');
  revalidatePath('/admin/delivery');
  revalidatePath('/checkout');
  redirect('/admin/delivery?message=' + encodeURIComponent('Delivery zone deleted.'));
}
