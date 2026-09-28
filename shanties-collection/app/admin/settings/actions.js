'use server';

import { redirect } from 'next/navigation';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const str = (fd, k, max = 500) => String(fd.get(k) ?? '').trim().slice(0, max);
const bool = (fd, k) => fd.get(k) === 'on' || fd.get(k) === 'true';

const SOCIAL_BASE = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/@',
  x: 'https://x.com/',
  youtube: 'https://youtube.com/@',
};

function cleanUsername(raw) {
  return String(raw || '')
    .replace(/^https?:\/\/[^/]+\//i, '')  // strip https://domain/
    .replace(/^@/, '')                     // strip leading @
    .replace(/\/+$/, '')                   // strip trailing slashes
    .trim();
}

export async function saveSettings(formData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/settings');

  const group = str(formData, 'group');
  if (!group) redirect('/admin/settings?error=' + encodeURIComponent('Unknown settings group.'));

  let value = {};

  if (group === 'payments') {
    value = {
      stk_enabled: bool(formData, 'stk_enabled'),
      manual_enabled: bool(formData, 'manual_enabled'),
      paybill: str(formData, 'paybill', 40),
      till: str(formData, 'till', 40),
      business_phone: str(formData, 'business_phone', 40),
    };
  } else if (group === 'contact') {
    value = {
      phone: str(formData, 'phone', 40),
      whatsapp: str(formData, 'whatsapp', 40),
      email: str(formData, 'email', 120),
      address: str(formData, 'address', 300),
      hours: str(formData, 'hours', 200),
    };
  } else if (group === 'social') {
    value = {};
    for (const key of Object.keys(SOCIAL_BASE)) {
      const username = cleanUsername(str(formData, key, 200));
      value[key] = username ? SOCIAL_BASE[key] + username : '';
    }
  } else if (group === 'store') {
    value = {
      name: str(formData, 'name', 120),
      description: str(formData, 'description', 500),
    };
  } else {
    redirect('/admin/settings?error=' + encodeURIComponent('Unknown settings group.'));
  }

  const service = createServiceClient();
  const { error } = await service
    .from('admin_settings')
    .upsert({ key: group, value, is_public: true }, { onConflict: 'key' });

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag('store');
  revalidatePath('/admin/settings');
  revalidatePath('/checkout');
  revalidatePath('/');
  redirect(`/admin/settings?message=${encodeURIComponent('Settings saved.')}&tab=${group}`);
}
