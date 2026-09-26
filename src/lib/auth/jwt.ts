import { SignJWT, jwtVerify } from 'jose';
import { AuthSessionPayload, UserRole } from '@/types/auth.types';

export const ADMIN_COOKIE_NAME = 'tbh_admin_token';
export const CUSTOMER_COOKIE_NAME = 'tbh_customer_token';

// Secret key for JWT signing (Edge runtime compatible)
const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'thebloomingher-production-secure-auth-secret-key-2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Creates a signed JWT token valid for 7 days.
 */
export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT token and returns the payload if valid.
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
    };
  } catch {
    return null;
  }
}
