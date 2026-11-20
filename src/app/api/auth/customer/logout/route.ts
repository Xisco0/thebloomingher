import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthCookieOptions } from '@/lib/supabase/cookies';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname;
  const cookieOptions = getAuthCookieOptions(host);

  // 1. Terminate Supabase Auth session on the server
  try {
    const supabase = createServerSupabaseClient(host);
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.warn('[Supabase Server SignOut Notice]:', err);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  // Anti-caching security headers so browsers/proxies never cache logout response
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // 2. Clear customer JWT cookie across matching domain and host
  // A) Domain-scoped cookie (.thebloomingher.com in production)
  if (cookieOptions.domain) {
    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: '/',
      domain: cookieOptions.domain,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  // B) Host-only cookie (no domain, handles localhost / preview environments)
  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // C) Clear any leftover auth redirect cookies
  response.cookies.set({
    name: 'auth_redirect',
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // D) Clear all Supabase auth token cookies present in request
  req.cookies.getAll().forEach(c => {
    if (c.name.startsWith('sb-') && c.name.includes('auth-token')) {
      if (cookieOptions.domain) {
        response.cookies.set({
          name: c.name,
          value: '',
          path: '/',
          domain: cookieOptions.domain,
          maxAge: 0,
          expires: new Date(0),
        });
      }
      response.cookies.set({
        name: c.name,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
  });

  return response;
}
