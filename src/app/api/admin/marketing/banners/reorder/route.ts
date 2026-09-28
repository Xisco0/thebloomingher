import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Update Supabase priority_order for each banner
    try {
      await Promise.all(
        body.orderedIds.map((id: string, index: number) =>
          supabaseAdmin
            .from('marketing_banners')
            .update({ priority_order: index + 1, updated_at: new Date().toISOString() })
            .eq('id', id)
        )
      );
    } catch (dbErr) {
      console.warn('[Admin Banners Reorder] Supabase update error:', dbErr);
    }

    // Invalidate cache so storefront immediately picks up new order
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, banners: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
