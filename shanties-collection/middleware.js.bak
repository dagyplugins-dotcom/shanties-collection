import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Keeps the login session fresh. Runs ONLY on account-related routes so public pages stay fast and cacheable.
export async function middleware(request) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/login', '/register', '/reset-password', '/checkout/:path*', '/orders/:path*'],
};
