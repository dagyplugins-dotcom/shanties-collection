'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isEmail, normalizePhone, safeNext, siteUrl } from '@/lib/utils';

const q = (s) => encodeURIComponent(s);
const str = (fd, k, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);

export async function signIn(formData) {
  const email = str(formData, 'email').toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(str(formData, 'next'));
  if (!isEmail(email) || !password) redirect(`/login?error=${q('Enter your email and password.')}&next=${q(next)}`);

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /confirm/i.test(error.message) ? 'Please confirm your email first. Check your inbox.' : 'Wrong email or password.';
    redirect(`/login?error=${q(msg)}&next=${q(next)}`);
  }
  redirect(next);
}

export async function signUp(formData) {
  const full_name = str(formData, 'full_name', 80);
  const email = str(formData, 'email').toLowerCase();
  const phone = normalizePhone(str(formData, 'phone', 20));
  const password = String(formData.get('password') ?? '');

  const fail = (m) => redirect(`/register?error=${q(m)}`);
  if (full_name.length < 2) fail('Enter your full name.');
  if (!isEmail(email)) fail('Enter a valid email address.');
  if (!phone) fail('Enter a valid Kenyan phone number, like 0712 345 678.');
  if (password.length < 8) fail('Use a password with at least 8 characters.');

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone }, emailRedirectTo: `${siteUrl()}/auth/callback?next=/account` },
  });
  if (error) fail(/registered|exists/i.test(error.message) ? 'That email already has an account. Try logging in.' : 'We could not create your account. Please try again.');
  if (!data.session) redirect(`/login?message=${q('Account created. Check your email to confirm it, then log in.')}`);
  redirect('/account');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function requestReset(formData) {
  const email = str(formData, 'email').toLowerCase();
  if (!isEmail(email)) redirect(`/forgot-password?error=${q('Enter a valid email address.')}`);
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/reset-password` });
  // Same message whether or not the account exists (prevents account probing).
  redirect(`/forgot-password?message=${q('If that email has an account, we have sent a link to reset the password.')}`);
}

export async function updatePassword(formData) {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) redirect(`/reset-password?error=${q('Use a password with at least 8 characters.')}`);
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${q('That link has expired. Request a new one.')}`);
  redirect(`/account?message=${q('Password updated.')}`);
}

export async function updateProfile(formData) {
  const full_name = str(formData, 'full_name', 80);
  const phone = normalizePhone(str(formData, 'phone', 20));
  if (full_name.length < 2) redirect(`/account?error=${q('Enter your full name.')}`);
  if (!phone) redirect(`/account?error=${q('Enter a valid Kenyan phone number.')}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');
  const { error } = await supabase.from('profiles').update({ full_name, phone }).eq('id', user.id);
  if (error) redirect(`/account?error=${q('We could not save your details. Please try again.')}`);
  redirect(`/account?message=${q('Profile saved.')}`);
}
