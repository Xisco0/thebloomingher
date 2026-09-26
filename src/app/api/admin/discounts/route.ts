import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { DiscountCoupon } from '@/types/cms.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const discounts = cmsStore.getDiscounts();
    return NextResponse.json({ success: true, discounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const discount: DiscountCoupon = {
      id: body.id || `disc-${Date.now()}`,
      code: body.code.toUpperCase().trim(),
      type: body.type || 'percentage',
      value: Number(body.value) || 0,
      min_spend: body.min_spend ? Number(body.min_spend) : undefined,
      max_discount: body.max_discount ? Number(body.max_discount) : undefined,
      usage_limit: body.usage_limit ? Number(body.usage_limit) : undefined,
      usage_count: Number(body.usage_count) || 0,
      start_date: body.start_date || undefined,
      end_date: body.end_date || undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      first_order_only: Boolean(body.first_order_only),
      created_at: body.created_at || new Date().toISOString(),
    };

    const saved = cmsStore.saveDiscount(discount);
    return NextResponse.json({ success: true, discount: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Discount ID required' }, { status: 400 });
    }

    cmsStore.deleteDiscount(id);
    return NextResponse.json({ success: true, message: 'Discount deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
