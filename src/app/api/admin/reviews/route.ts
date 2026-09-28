import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { ProductReview } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviewsMap = new Map<string, ProductReview>();
    let hasDbReviews = false;

    // 1. Fetch live reviews from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        hasDbReviews = true;
        data.forEach((r: any) => {
          reviewsMap.set(r.id, {
            id: r.id,
            product_id: r.product_id,
            author_name: r.author_name,
            rating: Number(r.rating || 5),
            title: r.title,
            comment: r.comment,
            is_verified_purchase: Boolean(r.is_verified_purchase),
            helpful_votes: Number(r.helpful_votes || 0),
            created_at: r.created_at,
          });
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Reviews GET] Supabase fetch error:', dbErr);
    }

    // 2. Fallback to memory reviews only if DB query failed
    if (!hasDbReviews) {
      const memoryReviews = cmsStore.getReviews();
      memoryReviews.forEach(r => {
        reviewsMap.set(r.id, r);
      });
    }

    const reviews = Array.from(reviewsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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

    // 1. Sync to memory store
    const saved = cmsStore.addReview(review);

    // 2. Persist to Supabase
    try {
      await supabaseAdmin.from('product_reviews').upsert({
        id: review.id,
        product_id: review.product_id,
        author_name: review.author_name,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        is_verified_purchase: review.is_verified_purchase,
        helpful_votes: review.helpful_votes,
        created_at: review.created_at,
      });
    } catch (dbErr) {
      console.warn('[Admin Reviews POST] Supabase insert error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

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

    // 1. Delete from memory store
    cmsStore.deleteReview(id);

    // 2. Delete from Supabase
    try {
      await supabaseAdmin.from('product_reviews').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('[Admin Reviews DELETE] Supabase delete error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

