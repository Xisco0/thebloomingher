import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { cmsService } from '@/services/cms.service';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const announcements = await cmsService.getAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageText = body.text || body.message;
    if (!messageText) {
      return NextResponse.json({ success: false, error: 'Announcement message is required' }, { status: 400 });
    }

    // 1. Save to memory store
    const saved = cmsStore.saveAnnouncement(body);

    // 2. Upsert in Supabase
    try {
      await supabaseAdmin.from('marketing_announcements').upsert({
        id: saved.id,
        text: saved.message,
        highlight_text: null,
        link_text: saved.link_text || null,
        link_url: saved.link_url || null,
        style_variant: 'brand',
        status: saved.status || 'active',
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      });
    } catch (dbErr) {
      console.warn('[Admin Announcements POST] Supabase upsert error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, announcement: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Announcement ID required' }, { status: 400 });
    }

    // 1. Delete from memory store
    const deleted = cmsStore.deleteAnnouncement(id);

    // 2. Delete from Supabase
    try {
      await supabaseAdmin.from('marketing_announcements').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('[Admin Announcements DELETE] Supabase delete error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: deleted, message: 'Announcement deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


