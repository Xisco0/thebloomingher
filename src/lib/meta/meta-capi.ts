import crypto from 'crypto';

export interface MetaContentItem {
  id: string;
  quantity: number;
  item_price?: number;
}

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: MetaContentItem[];
  content_type?: 'product' | 'product_group';
  num_items?: number;
  order_id?: string;
  delivery_category?: 'home_delivery' | 'in_store';
  [key: string]: any;
}

export interface MetaUserDataInput {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface MetaCapiEventInput {
  eventName:
    | 'PageView'
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'AddPaymentInfo'
    | 'Purchase'
    | string;
  eventId: string;
  eventSourceUrl?: string;
  userData: MetaUserDataInput;
  customData?: MetaCustomData;
  actionSource?: 'website' | 'system_generated' | 'app';
  eventTime?: number;
}

/**
 * Normalizes and hashes data according to Meta CAPI specification using SHA-256.
 */
export function hashMetaField(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

/**
 * Normalizes phone numbers to E.164-compatible digits only, defaulting to Nigeria (+234) if national.
 */
export function normalizeMetaPhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Handle Nigerian prefixes: 080..., 090..., 070..., 081...
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '234' + digits.substring(1);
  } else if (!digits.startsWith('234') && digits.length === 10) {
    digits = '234' + digits;
  }
  return digits;
}

/**
 * Builds the hashed Meta user_data object adhering strictly to the Meta Graph API schema.
 */
export function buildMetaUserData(input: MetaUserDataInput): Record<string, any> {
  const userData: Record<string, any> = {};

  if (input.email) {
    const hashed = hashMetaField(input.email);
    if (hashed) userData.em = [hashed];
  }

  if (input.phone) {
    const normPhone = normalizeMetaPhone(input.phone);
    const hashed = hashMetaField(normPhone);
    if (hashed) userData.ph = [hashed];
  }

  if (input.firstName) {
    const hashed = hashMetaField(input.firstName.replace(/[0-9!@#$%^&*(),.?":{}|<>]/g, ''));
    if (hashed) userData.fn = [hashed];
  }

  if (input.lastName) {
    const hashed = hashMetaField(input.lastName.replace(/[0-9!@#$%^&*(),.?":{}|<>]/g, ''));
    if (hashed) userData.ln = [hashed];
  }

  if (input.city) {
    const hashed = hashMetaField(input.city);
    if (hashed) userData.ct = [hashed];
  }

  if (input.state) {
    const hashed = hashMetaField(input.state);
    if (hashed) userData.st = [hashed];
  }

  if (input.country) {
    // 2-letter country code
    const country = input.country.length === 2 ? input.country.toLowerCase() : 'ng';
    const hashed = hashMetaField(country);
    if (hashed) userData.country = [hashed];
  } else {
    // Default to Nigeria
    const hashed = hashMetaField('ng');
    if (hashed) userData.country = [hashed];
  }

  if (input.zip) {
    const hashed = hashMetaField(input.zip);
    if (hashed) userData.zp = [hashed];
  }

  if (input.externalId) {
    const hashed = hashMetaField(input.externalId);
    if (hashed) userData.external_id = [hashed];
  }

  // Raw, unhashed client identifiers
  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress;
  }

  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent;
  }

  if (input.fbp) {
    userData.fbp = input.fbp;
  }

  if (input.fbc) {
    userData.fbc = input.fbc;
  }

  return userData;
}

/**
 * Sends a server-side conversion event to Meta Conversions API (CAPI).
 * Safe and non-blocking: Never throws unhandled errors or blocks checkout flow.
 */
export async function sendMetaCapiEvent(
  params: MetaCapiEventInput
): Promise<{ success: boolean; data?: any; error?: string; skipped?: boolean }> {
  const pixelId = (
    process.env.META_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  ).trim();

  const accessToken = (
    process.env.META_ACCESS_TOKEN ||
    process.env.FB_ACCESS_TOKEN ||
    ''
  ).trim();

  if (!pixelId || !accessToken) {
    // Graceful skip if credentials are not yet populated in environment
    return {
      success: true,
      skipped: true,
      error: 'Meta Pixel ID or Access Token is not configured in environment variables.',
    };
  }

  const {
    eventName,
    eventId,
    eventSourceUrl,
    userData,
    customData,
    actionSource = 'website',
    eventTime = Math.floor(Date.now() / 1000),
  } = params;

  const formattedUserData = buildMetaUserData(userData);

  // Default currency is always NGN
  const formattedCustomData: MetaCustomData = {
    currency: 'NGN',
    ...customData,
  };

  const eventPayload: Record<string, any> = {
    event_name: eventName,
    event_time: eventTime,
    event_id: eventId,
    action_source: actionSource,
    user_data: formattedUserData,
    custom_data: formattedCustomData,
  };

  if (eventSourceUrl) {
    eventPayload.event_source_url = eventSourceUrl;
  }

  const requestBody: Record<string, any> = {
    data: [eventPayload],
  };

  const testEventCode = (process.env.META_TEST_EVENT_CODE || '').trim();
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  const endpoint = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(
    accessToken
  )}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });

    const responseJson = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn('[Meta CAPI Warning] Server-side event submission failed:', {
        status: res.status,
        error: responseJson.error || responseJson,
        eventName,
        eventId,
      });
      return {
        success: false,
        error: responseJson?.error?.message || `HTTP ${res.status} response from Meta`,
      };
    }

    return {
      success: true,
      data: responseJson,
    };
  } catch (err: any) {
    console.warn('[Meta CAPI Network Error]:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Network error communicating with Meta Conversions API',
    };
  }
}
