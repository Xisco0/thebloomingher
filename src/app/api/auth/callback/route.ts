import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { authService } from '@/services/auth.service';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  const cookieRedirect = request.cookies.get('auth_redirect')?.value;
  const redirect = cookieRedirect ? decodeURIComponent(cookieRedirect) : (requestUrl.searchParams.get('redirect') || '/account');
  const targetOrigin = requestUrl.origin || getSiteUrl();

  // If OAuth provider returned an error query parameter
  if (errorParam || errorDescription) {
    const errorMsg = errorDescription || errorParam || 'Google authentication failed';
    const redirectErrorUrl = new URL(`/account/login?error=${encodeURIComponent(errorMsg)}`, targetOrigin);
    const res = NextResponse.redirect(redirectErrorUrl);
    res.cookies.delete('auth_redirect');
    return res;
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbhyafrdczdazuueibeu.supabase.co';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

    const safeRedirect = redirect.startsWith('/') ? redirect : '/account';
    let redirectResponse = NextResponse.redirect(new URL(safeRedirect, targetOrigin));
    redirectResponse.cookies.delete('auth_redirect');

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.session?.user) {
        const user = data.session.user;
        const email = user.email || '';
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const firstName = user.user_metadata?.first_name || fullName.split(' ')[0] || 'Customer';
        const lastName = user.user_metadata?.last_name || fullName.split(' ').slice(1).join(' ') || '';
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

        // Sync customer in database/auth service
        const authResult = await authService.customerGoogleAuth({
          email,
          name: fullName,
          firstName,
          lastName,
          googleId: user.id,
          avatarUrl,
        });

        if (authResult.success && authResult.token) {
          redirectResponse.cookies.set({
            name: CUSTOMER_COOKIE_NAME,
            value: authResult.token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
        }

        return redirectResponse;
      } else if (error) {
        console.warn('[Supabase Auth Callback Exchange Error]:', error.message);
        const redirectErrorUrl = new URL(`/account/login?error=${encodeURIComponent(error.message)}`, targetOrigin);
        const res = NextResponse.redirect(redirectErrorUrl);
        res.cookies.delete('auth_redirect');
        return res;
      }
    } catch (err: any) {
      console.error('[Auth Callback Exception]:', err);
      const redirectErrorUrl = new URL(`/account/login?error=${encodeURIComponent(err.message || 'Authentication error')}`, targetOrigin);
      const res = NextResponse.redirect(redirectErrorUrl);
      res.cookies.delete('auth_redirect');
      return res;
    }
  }

  // Fallback redirect
  const safeRedirect = redirect.startsWith('/') ? redirect : '/account';
  const response = NextResponse.redirect(new URL(safeRedirect, targetOrigin));
  response.cookies.delete('auth_redirect');
  return response;
}
