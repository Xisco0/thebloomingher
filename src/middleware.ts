import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminSessionToken,
  verifySessionToken,
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
} from '@/lib/auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 0. Catch OAuth Authorization Code if landed on root or non-callback page
  if (
    searchParams.has('code') &&
    !pathname.startsWith('/auth/callback') &&
    !pathname.startsWith('/api/auth/callback')
  ) {
    const callbackUrl = new URL('/auth/callback', req.url);
    callbackUrl.search = req.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // 1. Admin Route & API Protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const isChangePasswordPage = pathname === '/admin/change-password';
    const isAuthApi = pathname.startsWith('/api/auth/admin/');
    const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    let adminSession = null;
    let isSessionValid = false;
    let isIdle = false;
    let isExpired = false;

    if (adminToken) {
      const verification = await verifyAdminSessionToken(adminToken);
      if (verification.valid && verification.session) {
        adminSession = verification.session;
        isSessionValid = adminSession.role !== 'customer';
      } else {
        isIdle = verification.isIdle;
        isExpired = verification.isExpired;
      }
    }

    // If unauthenticated, expired, or idle when trying to access protected admin resources
    if (!isSessionValid && !isLoginPage && !isAuthApi) {
      if (pathname.startsWith('/api/admin')) {
        const status = isIdle || isExpired ? 401 : 401;
        const res = NextResponse.json(
          {
            success: false,
            error: isIdle
              ? 'Session timed out after 30 minutes of inactivity. Please log in again.'
              : isExpired
              ? 'Session expired (maximum 8-hour lifetime reached). Please log in again.'
              : 'Unauthorized: Admin authentication required.',
            isIdle,
            isExpired,
          },
          { status }
        );
        res.cookies.delete(ADMIN_COOKIE_NAME);
        return res;
      }

      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      if (isIdle) {
        loginUrl.searchParams.set('reason', 'idle_timeout');
      } else if (isExpired) {
        loginUrl.searchParams.set('reason', 'session_expired');
      }

      const response = NextResponse.redirect(loginUrl);
      if (adminToken) {
        response.cookies.delete(ADMIN_COOKIE_NAME);
      }
      return response;
    }

    // If already logged in as valid admin and visiting login page
    if (isSessionValid && isLoginPage) {
      if (adminSession?.mustChangePassword) {
        return NextResponse.redirect(new URL('/admin/change-password', req.url));
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // If authenticated admin MUST change password on first login
    if (isSessionValid && adminSession?.mustChangePassword) {
      if (!isChangePasswordPage && !isAuthApi) {
        if (pathname.startsWith('/api/admin/')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Password change required before accessing administrative resources.',
              mustChangePassword: true,
            },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/admin/change-password', req.url));
      }
    }

    // Enforce role-based access control for administrative pages
    if (isSessionValid && !pathname.startsWith('/api/')) {
      const role = adminSession?.role;
      const roleId = adminSession?.roleId;
      const perms = adminSession?.permissions || [];
      const isSuperAdmin = role === 'super_admin' || roleId === 'role-super-admin' || perms.includes('*');
      const isAdministrator = role === 'admin' || roleId === 'role-admin';

      if (!isSuperAdmin && !isAdministrator) {
        // Staff/custom roles require specific permissions to view Team management pages
        if (pathname.startsWith('/admin/administrators') || pathname.startsWith('/admin/roles')) {
          const hasTeamAccess =
            perms.includes('admins.view') ||
            perms.includes('admins.*') ||
            perms.includes('roles.view') ||
            perms.includes('roles.*');
          if (!hasTeamAccess) {
            return NextResponse.redirect(new URL('/admin', req.url));
          }
        }

        // Staff/custom roles require specific permissions to view Settings and Audit Trail
        if (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/audit-logs')) {
          const hasSettingsAccess =
            perms.includes('settings.view') ||
            perms.includes('settings.*') ||
            perms.includes('audit_logs.view') ||
            perms.includes('audit_logs.*');
          if (!hasSettingsAccess) {
            return NextResponse.redirect(new URL('/admin', req.url));
          }
        }
      }
    }

    // Prepare response with anti-caching security headers so Back button never shows cached admin data
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }

  // 2. Customer Account Route Protection
  if (pathname.startsWith('/account')) {
    const isCustomerAuthPage = pathname === '/account/login' || pathname === '/account/register';
    const customerToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

    let customerSession = null;
    if (customerToken) {
      customerSession = await verifySessionToken(customerToken);
    }

    const isCustomer = customerSession && customerSession.role === 'customer';

    if (!isCustomer && !isCustomerAuthPage) {
      const loginUrl = new URL('/account/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isCustomer && isCustomerAuthPage) {
      return NextResponse.redirect(new URL('/account', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, public files
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api/images).*)',
  ],
};
