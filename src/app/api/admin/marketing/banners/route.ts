import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { BannerFilterOptions, BannerPlacement, BannerStatus, BannerType } from '@/types/marketing-cms.types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as BannerStatus | 'all' | undefined;
    const type = searchParams.get('type') as BannerType | 'all' | undefined;
    const placement = searchParams.get('placement') as BannerPlacement | 'all' | undefined;
    const campaign_id = searchParams.get('campaign_id') || undefined;

    const filters: BannerFilterOptions = {
      search,
      status: status || 'all',
      type: type || 'all',
      placement: placement || 'all',
      campaign_id,
    };

    const banners = cmsStore.getBanners(filters);
    return NextResponse.json({ success: true, banners });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.desktop_image_url) {
      return NextResponse.json(
        { success: false, error: 'Title and desktop image are required' },
        { status: 400 }
      );
    }

    const saved = cmsStore.saveBanner(body);
    return NextResponse.json({ success: true, banner: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }
    const saved = cmsStore.saveBanner(body);
    return NextResponse.json({ success: true, banner: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }

    const deleted = cmsStore.deleteBanner(id);
    return NextResponse.json({ success: deleted, message: 'Banner deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
