import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { authService } from '@/services/auth.service';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { getSiteUrl } from '@/lib/site-url';
import { getAuthCookieOptions, sanitizeAuthDiagnostics } from '@/lib/supabase/cookies';

export async function handleAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url);
  let code = requestUrl.searchParams.get('code');
  let errorParam = requestUrl.searchParams.get('error');
  let errorDescription = requestUrl.searchParams.get('error_description');

  if (!code && request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        code = (formData.get('code') as string) || null;
        if (!errorParam) errorParam = (formData.get('error') as string) || null;
        if (!errorDescription) errorDescription = (formData.get('error_description') as string) || null;
      } else if (contentType.includes('application/json')) {
        const json = await request.json();
        code = json.code || null;
        if (!errorParam) errorParam = json.error || null;
        if (!errorDescription) errorDescription = json.error_description || null;
      }
    } catch {}
  }

  // Compute accurate origin based on headers or URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  let targetOrigin = requestUrl.origin;

  if (forwardedHost) {
    targetOrigin = `${forwardedProto}://${forwardedHost}`;
  } else if (!targetOrigin || targetOrigin === 'null' || targetOrigin.includes('localhost:0')) {
    targetOrigin = getSiteUrl();
  }

  // Determine safe redirect destination
  const cookieRedirect = request.cookies.get('auth_redirect')?.value;
  const paramRedirect = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('next');
  const rawRedirect = cookieRedirect ? decodeURIComponent(cookieRedirect) : (paramRedirect || '/account');
  const safeRedirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/account';

  // 1. If OAuth provider returned an explicit error parameter (e.g. user cancelled or denied access)
  if (errorParam || errorDescription) {
    const errorMsg = errorDescription || errorParam || 'OAuth provider authorization failed';
    const sanitized = sanitizeAuthDiagnostics({
      host: forwardedHost || requestUrl.hostname,
      reason: 'provider_denied',
      errorMessage: errorMsg,
      userAgent: request.headers.get('user-agent'),
    });
    console.warn('[OAuth Provider Callback Notice]:', sanitized);

    const errorRedirect = new URL('/auth/auth-code-error?reason=access_denied', targetOrigin);
    const res = NextResponse.redirect(errorRedirect);
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.cookies.delete('auth_redirect');
    return res;
  }

  // 2. If callback was opened directly without an authorization code
  if (!code) {
    const sanitized = sanitizeAuthDiagnostics({
      host: forwardedHost || requestUrl.hostname,
      reason: 'missing_code',
      userAgent: request.headers.get('user-agent'),
    });
    console.warn('[OAuth Callback Missing Code]:', sanitized);

    const errorRedirect = new URL('/auth/auth-code-error?reason=missing_code', targetOrigin);
    const res = NextResponse.redirect(errorRedirect);
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.cookies.delete('auth_redirect');
    return res;
  }

  // 3. Process authorization code with PKCE verification
  const refId = 'tbh_' + Math.random().toString(36).substring(2, 9);
  const cookieNames = request.cookies.getAll().map(c => c.name);
  const hasVerifierCookie = cookieNames.some(name => name.includes('code-verifier'));

  const initDiagnostics = sanitizeAuthDiagnostics({
    refId,
    hasCode: true,
    codeLength: code.length,
    hasVerifierCookie,
    cookieNames: cookieNames.filter(n => n.startsWith('sb-') || n.includes('auth')),
    host: forwardedHost || requestUrl.hostname,
    userAgent: request.headers.get('user-agent'),
    reason: 'exchange_initiated',
  });
  console.info('[OAuth Callback Processing]:', initDiagnostics);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbhyafrdczdazuueibeu.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

  const cookieOptions = getAuthCookieOptions(targetOrigin);

  let redirectResponse = NextResponse.redirect(new URL(safeRedirect, targetOrigin));
  redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  redirectResponse.cookies.delete('auth_redirect');

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          redirectResponse.cookies.set(name, value, {
            ...options,
            ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
          });
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

      // Sync customer in database/auth service safely
      const authResult = await authService.customerGoogleAuth({
        email,
        name: fullName,
        firstName,
        lastName,
        googleId: user.id,
        avatarUrl,
      });

      if (!authResult.success || !authResult.token) {
        console.warn('[Customer Google Auth Sync Notice]:', {
          refId,
          error: authResult.error,
        });
        const errorRedirect = new URL(
          `/auth/auth-code-error?reason=sync_failed&ref=${encodeURIComponent(refId)}`,
          targetOrigin
        );
        const res = NextResponse.redirect(errorRedirect);
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.cookies.delete('auth_redirect');
        return res;
      }

      // Set Customer session token with matching cookie options
      redirectResponse.cookies.set({
        name: CUSTOMER_COOKIE_NAME,
        value: authResult.token,
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: '/',
        ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return redirectResponse;
    } else if (error) {
      const errorDiagnostics = sanitizeAuthDiagnostics({
        refId,
        hasCode: true,
        codeLength: code.length,
        hasVerifierCookie,
        host: forwardedHost || requestUrl.hostname,
        userAgent: request.headers.get('user-agent'),
        reason: 'pkce_exchange_failed',
        errorMessage: error.message,
        errorStatus: error.status,
      });
      console.warn('[Supabase Auth Callback Exchange Error]:', errorDiagnostics);

      const errorRedirect = new URL(
        `/auth/auth-code-error?reason=pkce_verification_failed&ref=${encodeURIComponent(refId)}`,
        targetOrigin
      );
      const res = NextResponse.redirect(errorRedirect);
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.cookies.delete('auth_redirect');
      return res;
    }
  } catch (err: any) {
    const excDiagnostics = sanitizeAuthDiagnostics({
      refId,
      hasCode: true,
      codeLength: code ? code.length : 0,
      hasVerifierCookie,
      host: forwardedHost || requestUrl.hostname,
      userAgent: request.headers.get('user-agent'),
      reason: 'callback_exception',
      errorMessage: err?.message || 'Unknown callback exception',
    });
    console.error('[Auth Callback Exception]:', excDiagnostics);

    const errorRedirect = new URL(
      `/auth/auth-code-error?reason=auth_error&ref=${encodeURIComponent(refId)}`,
      targetOrigin
    );
    const res = NextResponse.redirect(errorRedirect);
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.cookies.delete('auth_redirect');
    return res;
  }

  // Fallback safe redirect to error page if no session created
  const res = NextResponse.redirect(new URL('/auth/auth-code-error?reason=session_missing', targetOrigin));
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.cookies.delete('auth_redirect');
  return res;
}
