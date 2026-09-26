import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth/jwt';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!adminToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin session required.' }, { status: 401 });
    }

    const session = await verifySessionToken(adminToken);
    if (!session || session.role === 'customer') {
      return NextResponse.json({ success: false, error: 'Forbidden: Valid admin session required.' }, { status: 403 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password cannot be the same as your current temporary password.' },
        { status: 400 }
      );
    }

    const result = await authService.changeAdminPassword(session.userId, currentPassword, newPassword);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update password.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully! You now have full dashboard access.',
      admin: result.admin,
    });

    // Update HTTP-only cookie with fresh token (mustChangePassword: false)
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[Admin Change Password Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
