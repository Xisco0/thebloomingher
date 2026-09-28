import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.view');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const admin = cmsStore.getAdminById(params.id);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Administrator not found.' }, { status: 404 });
    }

    const isSuperAdmin = auth.session.role === 'super_admin' || auth.session.roleId === 'role-super-admin';
    const isTargetSuperAdmin = admin.role === 'super_admin' || admin.role_id === 'role-super-admin';

    // Prevent regular admins from viewing Superadmin records directly by ID
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view Super Administrator profiles.' },
        { status: 403 }
      );
    }

    const { password_hash, ...safeAdmin } = admin;

    // Get audit activity logs associated with this admin
    const auditLogs = cmsStore.getAuditLogs().filter(
      log => log.admin_email.toLowerCase() === admin.email.toLowerCase() || log.resource_id === admin.id
    );

    return NextResponse.json({
      success: true,
      data: safeAdmin,
      activity: auditLogs.slice(0, 25),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const targetAdmin = cmsStore.getAdminById(params.id);
    if (!targetAdmin) {
      return NextResponse.json({ success: false, error: 'Administrator not found.' }, { status: 404 });
    }

    const isSuperAdmin = auth.session.role === 'super_admin' || auth.session.roleId === 'role-super-admin';
    const isTargetSuperAdmin = targetAdmin.role === 'super_admin' || targetAdmin.role_id === 'role-super-admin';

    // Prevent regular admins from updating Superadmin accounts
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot modify a Super Administrator account.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Prevent regular admins from assigning the Superadmin role
    if (!isSuperAdmin && (body.role === 'super_admin' || body.role_id === 'role-super-admin')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: Only Super Administrators can assign the Super Administrator role.' },
        { status: 403 }
      );
    }

    const result = cmsStore.updateAdmin(params.id, body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Administrator updated successfully.',
      data: result.admin,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  // Prevent self-deletion
  if (auth.session.userId === params.id) {
    return NextResponse.json(
      { success: false, error: 'You cannot delete your own administrator account.' },
      { status: 400 }
    );
  }

  try {
    const targetAdmin = cmsStore.getAdminById(params.id);
    if (!targetAdmin) {
      return NextResponse.json({ success: false, error: 'Administrator not found.' }, { status: 404 });
    }

    const isSuperAdmin = auth.session.role === 'super_admin' || auth.session.roleId === 'role-super-admin';
    const isTargetSuperAdmin = targetAdmin.role === 'super_admin' || targetAdmin.role_id === 'role-super-admin';

    // Prevent regular admins from deleting Superadmin accounts
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot delete a Super Administrator account.' },
        { status: 403 }
      );
    }

    const result = cmsStore.deleteAdmin(params.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Administrator removed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

