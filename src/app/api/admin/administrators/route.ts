import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'admins.view');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    // 1. Sync from Supabase DB
    try {
      const { data: dbAdmins } = await supabaseAdmin.from('admin_users').select('*');
      if (dbAdmins && dbAdmins.length > 0) {
        cmsStore.syncAdminsFromDb(dbAdmins);
      }
    } catch (syncErr) {
      console.warn('[Supabase Admin Sync Warning]:', syncErr);
    }

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
      requestingEmail: auth.session.email,
      requestingRole: auth.session.role,
    });

    const roles = cmsStore.getRoles(auth.session.role);

    return NextResponse.json(
      {
        success: true,
        data: admins,
        roles,
        total: admins.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
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

    // Check if email already exists in Supabase or memory store
    try {
      const { data: dbAdmin } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (dbAdmin) {
        cmsStore.syncAdminsFromDb([dbAdmin]);
      }
    } catch (syncErr) {
      console.warn('[Supabase Sync Admin Warning]:', syncErr);
    }

    const existing = cmsStore.getAdminByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An administrator with this email address already exists.' },
        { status: 400 }
      );
    }

    const { admin, adminRecord, temporaryPassword } = cmsStore.createAdmin({
      first_name,
      last_name,
      email: cleanEmail,
      role_id,
      role,
      phone,
    });

    // Persist directly into Supabase admin_users table
    try {
      const { error: dbError } = await supabaseAdmin.from('admin_users').upsert({
        id: admin.id,
        email: admin.email,
        password_hash: adminRecord.password_hash,
        first_name: admin.first_name,
        last_name: admin.last_name,
        full_name: admin.full_name,
        role_id: admin.role_id,
        role_name: admin.role_name,
        role_slug: admin.role,
        status: admin.status,
        is_active: admin.is_active,
        must_change_password: admin.must_change_password,
        phone: admin.phone || null,
        created_at: admin.created_at,
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error('[Supabase admin_users insert error]:', dbError);
      }
    } catch (dbErr) {
      console.error('[Supabase DB Save Exception]:', dbErr);
    }

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

