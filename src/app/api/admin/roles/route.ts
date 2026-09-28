import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'roles.view');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const roles = cmsStore.getRoles(auth.session.role);
    return NextResponse.json({
      success: true,
      data: roles,
      total: roles.length,
    });
  } catch (error: any) {
    console.error('[Roles List Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'roles.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const isSuperAdmin = auth.session.role === 'super_admin' || auth.session.roleId === 'role-super-admin';
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: Only Super Administrators can manage roles.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Role name is required.' }, { status: 400 });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one permission must be assigned to the role.' },
        { status: 400 }
      );
    }

    const newRole = cmsStore.saveRole({
      name: name.trim(),
      description: description?.trim() || '',
      permissions,
    });

    return NextResponse.json({
      success: true,
      message: 'Role created successfully.',
      data: newRole,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Role Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

