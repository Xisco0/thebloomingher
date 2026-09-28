import { SignJWT, jwtVerify } from 'jose';
import { AuthSessionPayload, UserRole } from '@/types/auth.types';

export const ADMIN_COOKIE_NAME = 'tbh_admin_token';
export const CUSTOMER_COOKIE_NAME = 'tbh_customer_token';

// Maximum total session lifetime for Administrators: 8 Hours
export const ADMIN_MAX_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
export const ADMIN_MAX_SESSION_LIFETIME_SEC = 8 * 60 * 60; // 28800s

// Maximum idle inactivity allowed before automatic logout: 30 Minutes
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// Warning window before idle timeout: 2.5 minutes (150 seconds)
export const ADMIN_IDLE_WARNING_MS = 2.5 * 60 * 1000;

// Customer Session Max Lifetime: 30 Days
export const CUSTOMER_MAX_SESSION_LIFETIME_SEC = 30 * 24 * 60 * 60;

// Secret key for JWT signing (Edge runtime compatible)
const JWT_SECRET_STRING =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'thebloomingher-production-secure-auth-secret-key-2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Creates a signed JWT token for an Admin with explicit loginTime and lastActive timestamps.
 * Hard expires in 8 hours.
 */
export async function createAdminSessionToken(payload: AuthSessionPayload): Promise<string> {
  const now = Date.now();
  const loginTime = payload.loginTime || now;
  const lastActive = now;

  return new SignJWT({
    ...payload,
    loginTime,
    lastActive,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

/**
 * Creates a signed JWT session token (for Customers or generic use).
 */
export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  const isCustomer = payload.role === 'customer';
  if (!isCustomer) {
    return createAdminSessionToken(payload);
  }

  return new SignJWT({ ...payload, loginTime: Date.now(), lastActive: Date.now() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export interface AdminVerificationResult {
  valid: boolean;
  session: AuthSessionPayload | null;
  isExpired: boolean;
  isIdle: boolean;
  error?: string;
}

/**
 * Strictly verifies an Admin JWT token against:
 * 1. Cryptographic HMAC-SHA256 signature
 * 2. Absolute 8-Hour Maximum Session Lifetime
 * 3. 30-Minute Inactivity / Idle Timeout
 */
export async function verifyAdminSessionToken(token: string): Promise<AdminVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const now = Date.now();

    const session: AuthSessionPayload = {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      roleId: payload.roleId as string | undefined,
      permissions: (payload.permissions as string[]) || [],
      mustChangePassword: payload.mustChangePassword as boolean | undefined,
      loginTime: typeof payload.loginTime === 'number' ? payload.loginTime : (payload.iat ? payload.iat * 1000 : now),
      lastActive: typeof payload.lastActive === 'number' ? payload.lastActive : now,
    };

    // 1. Verify 8-Hour Absolute Lifetime Cap
    const sessionAgeMs = now - (session.loginTime || now);
    if (sessionAgeMs > ADMIN_MAX_SESSION_LIFETIME_MS) {
      return {
        valid: false,
        session: null,
        isExpired: true,
        isIdle: false,
        error: 'Maximum 8-hour session lifetime exceeded. Please re-authenticate.',
      };
    }

    // 2. Verify 30-Minute Idle Timeout
    const idleDurationMs = now - (session.lastActive || now);
    if (idleDurationMs > ADMIN_IDLE_TIMEOUT_MS) {
      return {
        valid: false,
        session: null,
        isExpired: false,
        isIdle: true,
        error: 'Session timed out due to 30 minutes of inactivity.',
      };
    }

    return {
      valid: true,
      session,
      isExpired: false,
      isIdle: false,
    };
  } catch (err: any) {
    return {
      valid: false,
      session: null,
      isExpired: true,
      isIdle: false,
      error: 'Invalid or expired session token.',
    };
  }
}

/**
 * Standard session verification (used by customer routes & backwards compatibility).
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      roleId: payload.roleId as string | undefined,
      permissions: (payload.permissions as string[]) || [],
      mustChangePassword: payload.mustChangePassword as boolean | undefined,
      loginTime: payload.loginTime as number | undefined,
      lastActive: payload.lastActive as number | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Refreshes an active admin session's `lastActive` timestamp while respecting the 8-hour hard lifetime.
 */
export async function refreshAdminSessionToken(token: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const result = await verifyAdminSessionToken(token);
  if (!result.valid || !result.session) {
    return {
      success: false,
      error: result.error || 'Cannot refresh invalid session.',
    };
  }

  // Check if remaining session lifetime is too low (< 1 minute)
  const now = Date.now();
  const sessionAge = now - (result.session.loginTime || now);
  if (sessionAge >= ADMIN_MAX_SESSION_LIFETIME_MS) {
    return {
      success: false,
      error: 'Maximum 8-hour session lifetime reached. Please log in again.',
    };
  }

  // Issue refreshed token with updated lastActive
  const refreshedToken = await createAdminSessionToken({
    ...result.session,
    lastActive: now,
  });

  return {
    success: true,
    token: refreshedToken,
  };
}
