import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth/jwt';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AuthSessionPayload, AdminUser } from '@/types/auth.types';

export interface AdminAuthResult {
  authorized: boolean;
  session?: AuthSessionPayload;
  admin?: AdminUser;
  errorResponse?: NextResponse;
}

/**
 * Robust backend enforcement helper for all admin APIs.
 * Verifies:
 * 1. Admin JWT signature
 * 2. 8-Hour Absolute Session Lifetime
 * 3. 30-Minute Inactivity Idle Timeout
 * 4. Account Active status in Supabase/Store
 * 5. Role & Granular Permission Authorization
 */
export async function requireAdminAuth(
  req: NextRequest,
  requiredPermission?: string
): Promise<AdminAuthResult> {
  const token =
    req.cookies.get(ADMIN_COOKIE_NAME)?.value ||
    req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      ),
    };
  }

  const verification = await verifyAdminSessionToken(token);

  if (!verification.valid || !verification.session) {
    const status = verification.isIdle || verification.isExpired ? 401 : 403;
    const response = NextResponse.json(
      {
        success: false,
        error: verification.error || 'Session expired. Please log in again.',
        isExpired: verification.isExpired,
        isIdle: verification.isIdle,
      },
      { status }
    );

    // Clear stale cookie on error
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return { authorized: false, errorResponse: response };
  }

  const { session } = verification;

  // Retrieve admin user to verify account is still active
  let admin = cmsStore.getAdminById(session.userId);
  if (!admin) {
    try {
      const { data: dbAdmin } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', session.userId)
        .maybeSingle();

      if (dbAdmin) {
        cmsStore.syncAdminsFromDb([dbAdmin]);
        admin = cmsStore.getAdminById(session.userId);
      }
    } catch (e) {}
  }

  if (admin && (!admin.is_active || admin.status === 'inactive' || admin.status === 'suspended')) {
    const res = NextResponse.json(
      { success: false, error: 'Administrator account has been deactivated or suspended.' },
      { status: 403 }
    );
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return { authorized: false, errorResponse: res };
  }

  // Permission Check
  if (requiredPermission && requiredPermission !== '*') {
    const permissions = session.permissions || [];
    const isSuperAdmin = session.role === 'super_admin' || permissions.includes('*');

    const hasPermission =
      isSuperAdmin ||
      permissions.includes(requiredPermission) ||
      permissions.some(p => {
        if (p.endsWith('.*')) {
          const prefix = p.slice(0, -2);
          return requiredPermission.startsWith(prefix);
        }
        return false;
      });

    if (!hasPermission) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Access Denied: Missing required permission "${requiredPermission}".`,
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authorized: true,
    session,
    admin,
  };
}
