import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.view');
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const admin = cmsStore.getAdminById(params.id);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Administrator not found.' }, { status: 404 });
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
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
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
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  // Prevent self-deletion
  if (auth.session?.userId === params.id) {
    return NextResponse.json(
      { success: false, error: 'You cannot delete your own administrator account.' },
      { status: 400 }
    );
  }

  try {
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
