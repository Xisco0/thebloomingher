'use client';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

/**
 * Retrieves a cookie value from document.cookie by name.
 */
export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Retrieves the Meta browser cookie (_fbp).
 */
export function getMetaFbp(): string | null {
  return getClientCookie('_fbp');
}

/**
 * Retrieves the Meta click identifier (_fbc), or generates it from fbclid URL query param if present.
 */
export function getMetaFbc(): string | null {
  const existingCookie = getClientCookie('_fbc');
  if (existingCookie) return existingCookie;

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      return `fb.1.${Date.now()}.${fbclid}`;
    }
  }

  return null;
}

/**
 * Generates a unique deduplication event ID.
 */
export function generateEventId(prefix = 'evt'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Fires a standard or custom Meta Pixel event in the browser.
 */
export function trackPixelEvent(
  eventName: string,
  params: Record<string, any> = {},
  eventId?: string
): void {
  if (typeof window === 'undefined') return;

  if (typeof window.fbq === 'function') {
    const options = eventId ? { eventID: eventId } : undefined;
    window.fbq('track', eventName, params, options);
  }
}

export interface DualTrackOptions {
  eventName: string;
  customData?: Record<string, any>;
  userData?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip?: string | null;
    externalId?: string | null;
  };
  eventId?: string;
}

/**
 * High-reliability Dual Tracking function:
 * 1. Fires browser Meta Pixel with eventID.
 * 2. Asynchronously forwards the event to server Conversions API (CAPI) with matching eventID.
 * Meta automatically deduplicates browser and server events using the identical event_name and event_id.
 */
export async function trackMetaDualEvent(options: DualTrackOptions): Promise<string> {
  const { eventName, customData = {}, userData = {}, eventId } = options;
  const finalEventId = eventId || generateEventId(eventName.toLowerCase());

  // Ensure default currency is NGN
  const enrichedCustomData = {
    currency: 'NGN',
    ...customData,
  };

  // 1. Browser Meta Pixel
  trackPixelEvent(eventName, enrichedCustomData, finalEventId);

  // 2. Server-side CAPI Forwarding
  if (typeof window !== 'undefined') {
    try {
      const fbp = getMetaFbp();
      const fbc = getMetaFbc();

      const payload = {
        eventName,
        eventId: finalEventId,
        eventSourceUrl: window.location.href,
        customData: enrichedCustomData,
        userData: {
          ...userData,
          fbp,
          fbc,
        },
      };

      const bodyStr = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([bodyStr], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/meta-capi', blob);
      } else {
        fetch('/api/analytics/meta-capi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return finalEventId;
}
