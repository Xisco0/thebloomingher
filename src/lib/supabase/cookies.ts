import type { CookieOptions } from '@supabase/ssr';

export const PROD_DOMAIN = 'thebloomingher.com';

/**
 * Determines the appropriate cookie domain based on the hostname.
 * In production (thebloomingher.com or *.thebloomingher.com), sets domain to `.thebloomingher.com`
 * so cookies are shared seamlessly across apex and www subdomains.
 * For localhost, preview URLs, or IPs, returns undefined to avoid RFC 6265 rejections.
 */
export function getDomainForHost(hostnameOrUrl?: string | null): string | undefined {
  if (!hostnameOrUrl) return undefined;

  let host = hostnameOrUrl.trim().toLowerCase();
  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      host = host.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    }
  } else {
    host = host.split(':')[0];
  }

  // Exact apex or any subdomain of thebloomingher.com
  if (host === PROD_DOMAIN || host.endsWith(`.${PROD_DOMAIN}`)) {
    return `.${PROD_DOMAIN}`;
  }

  return undefined;
}

/**
 * Returns unified cookie options for Supabase SSR and auth session cookies.
 * Ensures cookies are:
 * - Scoped to .thebloomingher.com in production so apex <-> www sharing works.
 * - Secure in production and HTTPS environments (preventing WebKit / Safari ITP drops).
 * - SameSite: 'lax' for reliable OAuth 2.0 redirect lifecycle.
 * - Path: '/' for site-wide availability.
 */
export function getAuthCookieOptions(hostnameOrUrl?: string | null): CookieOptions {
  const domain = getDomainForHost(hostnameOrUrl);
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps =
    typeof window !== 'undefined'
      ? window.location.protocol === 'https:'
      : isProduction || (hostnameOrUrl?.startsWith('https://') ?? false);

  return {
    path: '/',
    sameSite: 'lax',
    secure: isHttps || isProduction,
    ...(domain ? { domain } : {}),
  };
}

/**
 * Sanitizes server-side OAuth diagnostic information to ensure sensitive credentials
 * (authorization codes, access tokens, refresh tokens, client secrets, passwords)
 * are NEVER logged.
 */
export function sanitizeAuthDiagnostics(data: {
  refId?: string;
  hasCode?: boolean;
  codeLength?: number;
  hasVerifierCookie?: boolean;
  cookieNames?: string[];
  host?: string | null;
  userAgent?: string | null;
  reason?: string;
  errorMessage?: string;
  errorStatus?: number | string;
}) {
  return {
    refId: data.refId || 'none',
    hasCode: Boolean(data.hasCode),
    codeLength: typeof data.codeLength === 'number' ? data.codeLength : 0,
    hasVerifierCookie: Boolean(data.hasVerifierCookie),
    cookieNames: data.cookieNames || [],
    host: data.host || 'unknown',
    browserEngine: data.userAgent ? detectBrowserEngine(data.userAgent) : 'unknown',
    reason: data.reason || 'none',
    errorMessage: data.errorMessage ? sanitizeErrorMessage(data.errorMessage) : undefined,
    errorStatus: data.errorStatus,
    timestamp: new Date().toISOString(),
  };
}

function detectBrowserEngine(ua: string): string {
  const lower = ua.toLowerCase();
  if (lower.includes('samsungbrowser')) return 'Samsung Internet';
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('safari') && !lower.includes('chrome')) {
    return 'WebKit / Safari';
  }
  if (lower.includes('chrome') || lower.includes('crios')) return 'Chromium';
  if (lower.includes('firefox') || lower.includes('fxios')) return 'Gecko / Firefox';
  return 'Other';
}

function sanitizeErrorMessage(msg: string): string {
  // Strip any accidental code/token strings from error messages
  return msg
    .replace(/[a-f0-9]{32,}/gi, '[REDACTED_HASH]')
    .replace(/code=[^&\s]+/gi, 'code=[REDACTED]')
    .replace(/token=[^&\s]+/gi, 'token=[REDACTED]');
}
