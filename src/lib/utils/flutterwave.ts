/**
 * Flutterwave Helper Utilities
 * TheBloomingHer Care & Wellness
 */

/**
 * Generates a unique, URL-safe transaction reference for Flutterwave payments.
 * Format: TBH-FLW-<TIMESTAMP>-<RANDOM>
 * Example: TBH-FLW-1727560000000-A8B9C1
 */
export function generateFlutterwaveReference(prefix = 'TBH-FLW'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Verifies the secret hash sent by Flutterwave in the `verif-hash` header.
 * Ensures the webhook request originated from Flutterwave.
 */
export function verifyFlutterwaveSignature(
  headerHash: string | null | undefined,
  secretHash: string
): boolean {
  if (!headerHash || !secretHash) return false;
  return headerHash.trim() === secretHash.trim();
}

/**
 * Normalizes Flutterwave amount to fixed precision number.
 */
export function formatFlutterwaveAmount(amount: number): number {
  return Number(amount.toFixed(2));
}
