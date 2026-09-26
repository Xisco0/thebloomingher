import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaigns = cmsStore.getCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Campaign name is required' }, { status: 400 });
    }
    const saved = cmsStore.saveCampaign(body);
    return NextResponse.json({ success: true, campaign: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });
    }

    const deleted = cmsStore.deleteCampaign(id);
    return NextResponse.json({ success: deleted, message: 'Campaign deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
