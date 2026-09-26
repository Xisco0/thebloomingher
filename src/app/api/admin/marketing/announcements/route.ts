import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const announcements = cmsStore.getAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.message) {
      return NextResponse.json({ success: false, error: 'Announcement message is required' }, { status: 400 });
    }
    const saved = cmsStore.saveAnnouncement(body);
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

    const deleted = cmsStore.deleteAnnouncement(id);
    return NextResponse.json({ success: deleted, message: 'Announcement deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
