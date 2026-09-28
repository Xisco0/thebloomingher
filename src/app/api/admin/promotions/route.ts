import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { PromotionCampaign } from '@/types/cms.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const promotions = cmsStore.getPromotions();
    return NextResponse.json({ success: true, promotions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const promotion: PromotionCampaign = {
      id: body.id || `promo-${Date.now()}`,
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      banner_image: body.banner_image || undefined,
      description: body.description || undefined,
      cta_text: body.cta_text || 'Shop Now',
      cta_link: body.cta_link || '/shop',
      discount_percentage: body.discount_percentage ? Number(body.discount_percentage) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      start_date: body.start_date || undefined,
      end_date: body.end_date || undefined,
      placement: body.placement || 'homepage',
      created_at: body.created_at || new Date().toISOString(),
    };

    const saved = cmsStore.savePromotion(promotion);

    // Revalidate Next.js cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, promotion: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Promotion ID required' }, { status: 400 });
    }

    cmsStore.deletePromotion(id);

    // Revalidate Next.js cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, message: 'Promotion deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
