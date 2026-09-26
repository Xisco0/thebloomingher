import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { ProductReview } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviews = cmsStore.getReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const review: ProductReview = {
      id: body.id || `rev-${Date.now()}`,
      product_id: body.product_id,
      author_name: body.author_name,
      rating: Number(body.rating) || 5,
      title: body.title,
      comment: body.comment,
      created_at: body.created_at || new Date().toISOString(),
      is_verified_purchase: body.is_verified_purchase !== undefined ? Boolean(body.is_verified_purchase) : true,
      helpful_votes: Number(body.helpful_votes) || 0,
    };

    const saved = cmsStore.addReview(review);
    return NextResponse.json({ success: true, review: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });
    }

    cmsStore.deleteReview(id);
    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
