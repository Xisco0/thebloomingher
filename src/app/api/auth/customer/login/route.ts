import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await authService.customerLogin(email, password);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      customer: result.customer,
      message: 'Logged in successfully.',
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
    console.error('[Customer Login Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
