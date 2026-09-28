import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { MarketingEvent } from '@/types/marketing-cms.types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const memoryEvents = cmsStore.getEvents();
    const eventsMap = new Map<string, MarketingEvent>();

    // 1. Fetch from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (!error && data) {
        data.forEach((e: any) => {
          eventsMap.set(e.id, {
            id: e.id,
            name: e.name,
            slug: e.slug,
            description: e.description || '',
            tagline: e.tagline || undefined,
            event_date: e.event_date,
            start_time: e.start_time,
            end_time: e.end_time || undefined,
            location: e.location,
            is_online: Boolean(e.is_virtual || e.is_online),
            registration_url: e.registration_url || '',
            cta_text: e.cta_text || 'Register Now',
            desktop_image_url: e.desktop_image_url,
            mobile_image_url: e.mobile_image_url || undefined,
            status: e.status || 'upcoming',
            is_featured: Boolean(e.is_featured),
            created_at: e.created_at,
            updated_at: e.updated_at,
          });
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Events GET] Supabase fetch error:', dbErr);
    }

    // 2. Merge memory events
    memoryEvents.forEach(e => {
      if (!eventsMap.has(e.id)) {
        eventsMap.set(e.id, e);
      }
    });

    const events = Array.from(eventsMap.values()).sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.event_date || !body.desktop_image_url) {
      return NextResponse.json(
        { success: false, error: 'Name, date, and image are required' },
        { status: 400 }
      );
    }

    // 1. Save in memory store
    const saved = cmsStore.saveEvent(body);

    // 2. Upsert in Supabase
    try {
      await supabaseAdmin.from('marketing_events').upsert({
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        description: saved.description || null,
        event_date: saved.event_date,
        start_time: saved.start_time,
        end_time: saved.end_time || null,
        location: saved.location,
        is_virtual: Boolean(saved.is_online),
        registration_url: saved.registration_url || null,
        desktop_image_url: saved.desktop_image_url,
        mobile_image_url: saved.mobile_image_url || null,
        status: saved.status || 'upcoming',
        is_featured: Boolean(saved.is_featured),
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      });
    } catch (dbErr) {
      console.warn('[Admin Events POST] Supabase upsert error:', dbErr);
    }

    return NextResponse.json({ success: true, event: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID required' }, { status: 400 });
    }

    // 1. Delete from memory store
    const deleted = cmsStore.deleteEvent(id);

    // 2. Delete from Supabase
    try {
      await supabaseAdmin.from('marketing_events').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('[Admin Events DELETE] Supabase delete error:', dbErr);
    }

    return NextResponse.json({ success: deleted, message: 'Event deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

