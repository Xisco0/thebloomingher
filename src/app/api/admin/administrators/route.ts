import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'admins.view');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const isSuperAdmin = auth.session.role === 'super_admin' || auth.session.roleId === 'role-super-admin';

    // If non-superadmin attempts to query super_admin role, deny/strip
    const requestedRole = (!isSuperAdmin && (role === 'super_admin' || role === 'role-super-admin'))
      ? '__unauthorized_role__'
      : role;

    const admins = cmsStore.getAdmins({
      role: requestedRole,
      status,
      search,
      requestingAdminId: auth.session.userId,
      requestingRole: auth.session.role,
    });

    const roles = cmsStore.getRoles(auth.session.role);

    return NextResponse.json({
      success: true,
      data: admins,
      roles,
      total: admins.length,
    });
  } catch (error: any) {
    console.error('[Admin List Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'admins.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { first_name, last_name, email, role_id, role, phone } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required.' },
        { status: 400 }
      );
    }

    const isSuperAdmin = auth.session.role === 'super_admin' || auth.session.roleId === 'role-super-admin';

    // Prevent non-superadmins from creating or assigning Superadmin role
    if (!isSuperAdmin) {
      if (role_id === 'role-super-admin' || role === 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Permission denied: Only Super Administrators can assign the Super Administrator role.' },
          { status: 403 }
        );
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = cmsStore.getAdminByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An administrator with this email address already exists.' },
        { status: 400 }
      );
    }

    const { admin, temporaryPassword } = cmsStore.createAdmin({
      first_name,
      last_name,
      email: cleanEmail,
      role_id,
      role,
      phone,
    });

    return NextResponse.json({
      success: true,
      message: 'Administrator created successfully.',
      data: admin,
      temporaryPassword,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Admin Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

