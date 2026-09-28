import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { MarketingAnnouncement } from '@/types/marketing-cms.types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const memoryAnnouncements = cmsStore.getAnnouncements();
    const announcementsMap = new Map<string, MarketingAnnouncement>();

    // 1. Fetch from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((a: any) => {
          announcementsMap.set(a.id, {
            id: a.id,
            message: a.text || a.message || '',
            link_text: a.link_text || undefined,
            link_url: a.link_url || undefined,
            placement: (a.placement as any) || 'top_bar',
            is_closable: true,
            status: (a.status as any) || 'active',
            priority_order: 1,
            created_at: a.created_at,
            updated_at: a.updated_at,
          });
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Announcements GET] Supabase fetch error:', dbErr);
    }

    // 2. Merge memory announcements
    memoryAnnouncements.forEach(a => {
      if (!announcementsMap.has(a.id)) {
        announcementsMap.set(a.id, a);
      }
    });

    const announcements = Array.from(announcementsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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

    return NextResponse.json({ success: deleted, message: 'Announcement deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

