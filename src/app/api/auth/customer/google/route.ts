import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, firstName, lastName, googleId, avatarUrl } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Valid Google email is required.' },
        { status: 400 }
      );
    }

    const result = await authService.customerGoogleAuth({
      email,
      name,
      firstName,
      lastName,
      googleId,
      avatarUrl,
    });

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Google authentication failed.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      customer: result.customer,
      message: 'Signed in with Google successfully.',
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[Google Auth Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during Google Sign-In.' },
      { status: 500 }
    );
  }
}
