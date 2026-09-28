import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Prevent regular admins from resetting Superadmin passwords
    if (isTargetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot reset the password of a Super Administrator.' },
        { status: 403 }
      );
    }

    const result = cmsStore.resetAdminPassword(params.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Temporary password generated. The administrator must change this on next login.',
      temporaryPassword: result.temporaryPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

