import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';
import { AdminStatus } from '@/types/auth.types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  // Prevent self-deactivation/suspension
  if (auth.session.userId === params.id) {
    return NextResponse.json(
      { success: false, error: 'You cannot change the active status of your own account.' },
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

    // Prevent regular admins from altering Superadmin status
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot change the status of a Super Administrator.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body as { status: AdminStatus };

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (active, inactive, suspended) is required.' },
        { status: 400 }
      );
    }

    const result = cmsStore.setAdminStatus(params.id, status);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Administrator status changed to '${status}'.`,
      data: result.admin,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

