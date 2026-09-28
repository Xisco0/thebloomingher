import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth/jwt';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySessionToken(token);

    if (!session || session.role === 'customer') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const admin = cmsStore.getAdminById(session.userId);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Administrator not found' }, { status: 404 });
    }

    const { password_hash, ...safeAdmin } = admin;

    return NextResponse.json(
      {
        success: true,
        admin: safeAdmin,
        permissions: safeAdmin.permissions || [],
        must_change_password: safeAdmin.must_change_password || false,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
