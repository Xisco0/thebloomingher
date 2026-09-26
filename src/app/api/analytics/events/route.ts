import { NextRequest, NextResponse } from 'next/server';
import { recommendationService } from '@/services';
import { AnalyticsEventType } from '@/types';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  'product_view',
  'product_search',
  'category_view',
  'add_to_cart',
  'remove_from_cart',
  'checkout_started',
  'purchase',
  'wishlist_add',
  'wishlist_remove',
  'recommendation_impression',
  'recommendation_click',
  'recommendation_add_to_cart',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      event_type,
      anonymous_session_id,
      user_id,
      product_id,
      category_id,
      search_query,
      order_id,
      metadata,
    } = body;

    if (!event_type || !anonymous_session_id) {
      return NextResponse.json(
        { success: false, error: 'event_type and anonymous_session_id are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_EVENTS.includes(event_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid event_type: ${event_type}` },
        { status: 400 }
      );
    }

    // Privacy safeguard: Strip any potentially sensitive keys from metadata
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.card_number;
    delete sanitizedMetadata.cvv;
    delete sanitizedMetadata.token;

    const event = await recommendationService.trackEvent({
      event_type,
      anonymous_session_id,
      user_id: user_id || null,
      product_id: product_id || null,
      category_id: category_id || null,
      search_query: search_query ? search_query.substring(0, 100) : null,
      order_id: order_id || null,
      metadata: sanitizedMetadata,
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('[Analytics Event API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
