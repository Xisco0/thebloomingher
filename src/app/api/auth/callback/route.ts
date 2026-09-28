import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authService } from '@/services/auth.service';
import { CUSTOMER_COOKIE_NAME, createSessionToken } from '@/lib/auth/jwt';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/account';
  const targetOrigin = requestUrl.origin || getSiteUrl();

  if (code) {
    const supabase = createServerSupabaseClient();
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

      const response = NextResponse.redirect(new URL(redirect, targetOrigin));

      if (authResult.success && authResult.token) {
        response.cookies.set({
          name: CUSTOMER_COOKIE_NAME,
          value: authResult.token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
      }

      return response;
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL(redirect, targetOrigin));
}
