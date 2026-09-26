import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const duplicated = cmsStore.duplicateBanner(id);
    if (!duplicated) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, banner: duplicated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
