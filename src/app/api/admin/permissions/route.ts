import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission, SYSTEM_PERMISSIONS } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'roles.view');
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  // Group permissions by module
  const grouped: Record<string, typeof SYSTEM_PERMISSIONS> = {};
  SYSTEM_PERMISSIONS.forEach(perm => {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push(perm);
  });

  return NextResponse.json({
    success: true,
    data: SYSTEM_PERMISSIONS,
    grouped,
    total: SYSTEM_PERMISSIONS.length,
  });
}
