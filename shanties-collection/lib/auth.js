import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/supabase/public';

export async function getUser() {
  if (!isConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return { user: null, profile: null };
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('id,full_name,phone,email,role').eq('id', user.id).maybeSingle();
  return { user, profile: data };
}

export async function requireUser(next = '/account') {
  const { user, profile } = await getProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { user, profile };
}

// Admin-only gate for pages and server actions (used from Step 4).
export async function requireAdmin() {
  const { user, profile } = await getProfile();
  if (!user) redirect('/login?next=/admin');
  if (profile?.role !== 'admin') redirect('/');
  return { user, profile };
}
