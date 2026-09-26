import { AnalyticsEventType } from '@/types/recommendation.types';

const SESSION_KEY = 'tbh_anonymous_session_id';
const RECENTLY_VIEWED_KEY = 'tbh_recently_viewed_ids';
const MAX_RECENTLY_VIEWED = 10;

/**
 * Returns or creates a persistent anonymous session ID for privacy-safe behavior tracking.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'session-server';

  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return 'session-fallback';
  }
}

/**
 * Stores a product ID in the customer's local Recently Viewed list.
 */
export function addRecentlyViewedProductId(productId: string): void {
  if (typeof window === 'undefined' || !productId) return;

  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    let ids: string[] = raw ? JSON.parse(raw) : [];

    // Remove if already exists to push to front (most recent first)
    ids = ids.filter(id => id !== productId);
    ids.unshift(productId);

    if (ids.length > MAX_RECENTLY_VIEWED) {
      ids = ids.slice(0, MAX_RECENTLY_VIEWED);
    }

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('[Analytics] Failed to save recently viewed item:', err);
  }
}

/**
 * Retrieves the customer's local Recently Viewed product IDs list.
 */
export function getRecentlyViewedProductIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Lightweight fire-and-forget client analytics event tracker.
 */
export function trackClientEvent(
  eventType: AnalyticsEventType,
  details: {
    productId?: string;
    categoryId?: string;
    searchQuery?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getAnonymousSessionId();
    const payload = {
      event_type: eventType,
      anonymous_session_id: sessionId,
      product_id: details.productId,
      category_id: details.categoryId,
      search_query: details.searchQuery,
      order_id: details.orderId,
      metadata: details.metadata,
    };

    // Use sendBeacon if available for non-blocking unload safety, else fetch
    const bodyStr = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/events', blob);
    } else {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}
