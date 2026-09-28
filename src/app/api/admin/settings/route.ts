import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/rbac';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'settings.view');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const settings = cmsStore.getSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminPermission(req, 'settings.manage');
  if (!auth.authorized || !auth.session) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const updated = cmsStore.updateSiteSettings(body);

    // Revalidate Next.js cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
