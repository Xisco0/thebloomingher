import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, phone } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const result = await authService.customerRegister({
      firstName,
      lastName,
      email,
      password,
      phone,
    });

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      customer: result.customer,
      message: 'Account created successfully.',
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
    console.error('[Customer Register Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during account creation.' },
      { status: 500 }
    );
  }
}
