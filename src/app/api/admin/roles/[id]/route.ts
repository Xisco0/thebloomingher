import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'roles.view');
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const role = cmsStore.getRoleById(params.id);
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'roles.manage');
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const existing = cmsStore.getRoleById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
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

    const updated = cmsStore.saveRole({
      id: existing.id,
      name: name.trim(),
      slug: existing.slug,
      description: description !== undefined ? description.trim() : existing.description,
      permissions,
      is_system: existing.is_system,
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'roles.manage');
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const result = cmsStore.deleteRole(params.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
