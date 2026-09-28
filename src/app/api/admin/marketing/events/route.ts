import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { cmsService } from '@/services/cms.service';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await cmsService.getEvents();
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

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/events');
      if (saved.slug) {
        revalidatePath(`/events/${saved.slug}`);
      }
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
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

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/events');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: deleted, message: 'Event deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


