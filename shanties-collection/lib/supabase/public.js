import { createClient } from '@supabase/supabase-js';

let client;

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Cookie-free client for public storefront reads. Responses are cached for 60s,
// and admin saves also trigger an instant refresh (Step 4).
export function getPublicClient() {
  if (!isConfigured()) return null;
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, opts) => fetch(url, { ...opts, next: { revalidate: 60, tags: ['store'] } }) },
    });
  }
  return client;
}
