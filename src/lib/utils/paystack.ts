import crypto from 'crypto';

/**
 * Converts Naira to integer Kobo (smallest currency unit for Paystack).
 * Protects against floating-point inaccuracies by rounding to integer.
 * e.g., 5000.50 -> 500050, 40000 -> 4000000
 */
export function nairaToKobo(amountInNaira: number): number {
  return Math.round(Number(amountInNaira) * 100);
}

/**
 * Converts Kobo to Naira.
 * e.g., 500000 -> 5000
 */
export function koboToNaira(amountInKobo: number): number {
  return Number(amountInKobo) / 100;
}

/**
 * Generates a unique, collision-resistant payment reference for Paystack.
 * Format: tbh_ref_{timestamp}_{randomSuffix}
 */
export function generatePaystackReference(prefix = 'tbh'): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Verifies Paystack Webhook signature using HMAC SHA512.
 * Uses crypto.timingSafeEqual to protect against timing attacks.
 */
export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(hash, 'utf8');
    const actualBuffer = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error('Error verifying Paystack signature:', err);
    return false;
  }
}
