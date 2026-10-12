import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Keeps the login session fresh on account-related routes so public pages stay fast and cacheable.
// Also protects:
//   - page routes:    /admin/*        → redirect to /login or /
//   - API routes:     /api/admin/*    → JSON 401/403 (redirects break API clients)
//                     /api/account/*  → JSON 401 (require login)
//
// NOTE: /api/checkout is intentionally PUBLIC because guest checkout is allowed.
//       /api/mpesa/callback is intentionally PUBLIC because Safaricom calls it directly.
export async function middleware(request) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isAccountApiRoute = pathname.startsWith('/api/account') || pathname.startsWith('/api/orders');

  // ─── Admin protection ───
  if (isAdminRoute) {
    if (!user) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden. Admin access required.' },
          { status: 403 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('error', 'not_authorized');
      return NextResponse.redirect(url);
    }
  }

  // ─── Account API protection (login required) ───
  if (isAccountApiRoute && !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in.' },
      { status: 401 }
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Page routes
    '/account/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/reset-password',
    '/checkout/:path*',
    '/orders/:path*',
    // API routes (defensive — these don't exist yet, but future-proofed)
    '/api/admin/:path*',
    '/api/account/:path*',
    '/api/orders/:path*',
  ],
};