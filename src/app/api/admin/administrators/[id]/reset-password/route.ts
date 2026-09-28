import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function getOrSyncAdmin(id: string) {
  let admin = cmsStore.getAdminById(id);
  if (!admin) {
    try {
      const { data: dbAdmin } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .or(`id.eq.${id},email.eq.${id}`)
        .maybeSingle();

      if (dbAdmin) {
        cmsStore.syncAdminsFromDb([dbAdmin]);
        admin = cmsStore.getAdminById(id) || cmsStore.getAdminById(dbAdmin.id) || cmsStore.getAdminByEmail(id);
      }
    } catch (syncErr) {
      console.warn('[Supabase Admin Reset Lookup Warning]:', syncErr);
    }
  }
  return admin;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission(req, 'admins.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const targetAdmin = await getOrSyncAdmin(params.id);
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

    // Sync updated password hash to Supabase
    const updatedRecord = cmsStore.getAdminById(params.id);
    if (updatedRecord) {
      try {
        await supabaseAdmin.from('admin_users').update({
          password_hash: updatedRecord.password_hash,
          must_change_password: true,
          updated_at: new Date().toISOString(),
        }).eq('id', params.id);
      } catch (dbErr) {
        console.error('[Supabase Password Reset Error]:', dbErr);
      }
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

