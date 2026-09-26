import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    const updated = cmsStore.reorderBanners(body.orderedIds);
    return NextResponse.json({ success: true, banners: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
