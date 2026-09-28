import { NextRequest, NextResponse } from 'next/server';
import { refreshAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No active admin session found.' },
        { status: 401 }
      );
    }

    const refreshResult = await refreshAdminSessionToken(token);

    if (!refreshResult.success || !refreshResult.token) {
      const res = NextResponse.json(
        {
          success: false,
          error: refreshResult.error || 'Session renewal failed. Please log in again.',
        },
        { status: 401 }
      );
      res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin session renewed successfully.',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: refreshResult.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours hard max
    });

    return response;
  } catch (error: any) {
    console.error('[Admin Session Refresh Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while refreshing session.' },
      { status: 500 }
    );
  }
}
