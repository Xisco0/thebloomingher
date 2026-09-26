import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const folder = searchParams.get('folder') || undefined;

    const media = cmsStore.getMediaAssets(search, folder);
    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.filename || !body.url) {
      return NextResponse.json(
        { success: false, error: 'Filename and URL are required' },
        { status: 400 }
      );
    }
    const saved = cmsStore.saveMediaAsset(body);
    return NextResponse.json({ success: true, asset: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Media Asset ID required' }, { status: 400 });
    }

    const deleted = cmsStore.deleteMediaAsset(id);
    return NextResponse.json({ success: deleted, message: 'Media deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
