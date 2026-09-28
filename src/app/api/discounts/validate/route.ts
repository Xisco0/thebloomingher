import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code ? String(body.code).trim().toUpperCase() : '';
    const subtotal = Number(body.subtotal) || 0;

    if (!rawCode) {
      return NextResponse.json(
        { success: false, message: 'Please enter a discount code.' },
        { status: 400 }
      );
    }

    const discounts = cmsStore.getDiscounts();
    const matched = discounts.find(
      d => d.code.toUpperCase() === rawCode && d.is_active
    );

    if (!matched) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired discount code.' },
        { status: 404 }
      );
    }

    // Check expiration date if present
    if (matched.end_date && new Date(matched.end_date) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'This discount code has expired.' },
        { status: 400 }
      );
    }

    // Check minimum spend
    if (matched.min_spend && subtotal < matched.min_spend) {
      return NextResponse.json(
        {
          success: false,
          message: `This code requires a minimum purchase of ₦${matched.min_spend.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    // Check usage limits
    if (matched.usage_limit && matched.usage_count >= matched.usage_limit) {
      return NextResponse.json(
        { success: false, message: 'This discount code has reached its maximum usage limit.' },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (matched.type === 'percentage') {
      discountAmount = Math.round((subtotal * matched.value) / 100);
      if (matched.max_discount && discountAmount > matched.max_discount) {
        discountAmount = matched.max_discount;
      }
    } else {
      discountAmount = Math.min(subtotal, matched.value);
    }

    return NextResponse.json({
      success: true,
      discount: {
        code: matched.code,
        amount: discountAmount,
        type: matched.type,
        value: matched.value,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to validate discount code.' },
      { status: 500 }
    );
  }
}
