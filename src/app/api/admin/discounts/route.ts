import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { DiscountCoupon } from '@/types/cms.types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const discountsMap = new Map<string, DiscountCoupon>();
    let hasDbDiscounts = false;

    // 1. Fetch from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        hasDbDiscounts = true;
        data.forEach((c: any) => {
          discountsMap.set(c.id, {
            id: c.id,
            code: c.code,
            type: c.discount_type === 'fixed' || c.discount_type === 'fixed_amount' ? 'fixed_amount' : 'percentage',
            value: Number(c.discount_value || 0),
            min_spend: Number(c.minimum_spend || 0),
            usage_count: Number(c.usage_count || 0),
            is_active: c.status === 'active',
            first_order_only: false,
            created_at: c.created_at,
          });
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Discounts GET] Supabase fetch error:', dbErr);
    }

    // 2. Fallback to memory store only if DB query failed
    if (!hasDbDiscounts) {
      const memoryDiscounts = cmsStore.getDiscounts();
      memoryDiscounts.forEach(d => {
        discountsMap.set(d.id, d);
      });
    }

    const discounts = Array.from(discountsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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

    // 1. Save to memory store
    const saved = cmsStore.saveDiscount(discount);

    // 2. Upsert in Supabase
    try {
      await supabaseAdmin.from('marketing_coupons').upsert({
        id: saved.id,
        code: saved.code,
        title: `${saved.code} Discount`,
        description: saved.first_order_only ? 'First order discount' : 'Promo discount',
        discount_type: saved.type,
        discount_value: saved.value,
        minimum_spend: saved.min_spend || 0,
        status: saved.is_active ? 'active' : 'inactive',
        created_at: saved.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('[Admin Discounts POST] Supabase upsert error:', dbErr);
    }

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

    // 1. Delete from memory store
    cmsStore.deleteDiscount(id);

    // 2. Delete from Supabase
    try {
      await supabaseAdmin.from('marketing_coupons').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('[Admin Discounts DELETE] Supabase delete error:', dbErr);
    }

    return NextResponse.json({ success: true, message: 'Discount deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

