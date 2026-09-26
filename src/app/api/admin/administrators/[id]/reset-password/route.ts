import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.manage');
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
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
