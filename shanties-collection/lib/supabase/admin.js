import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS. Server only. Use exclusively after verifying the caller
// (requireAdmin) or inside payment callbacks that verify their own authenticity.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
