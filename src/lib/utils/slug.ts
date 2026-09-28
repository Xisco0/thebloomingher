/**
 * Generates clean, professional, SEO-friendly URL slugs for products and categories.
 * Handles ampersands, special characters, accents, trailing dashes, and clean formatting.
 *
 * Examples:
 * "Smart Menstrual Heating & Vibration Belt" -> "smart-menstrual-heating-vibration-belt"
 * "100% Organic Cotton Night Pads (Pack of 10)" -> "100-organic-cotton-night-pads-pack-of-10"
 * "Gentle pH-Balancing Foam Wash" -> "gentle-ph-balancing-foam-wash"
 */
export function generateProfessionalSlug(input: string, customSuffix?: string): string {
  if (!input) return '';

  let slug = input
    .trim()
    .toLowerCase()
    // Replace '&' with 'and'
    .replace(/&/g, ' and ')
    // Replace '+' with 'plus'
    .replace(/\+/g, ' plus ')
    // Replace '@' with 'at'
    .replace(/@/g, ' at ')
    // Remove apostrophes (e.g. "women's" -> "womens")
    .replace(/['’]/g, '')
    // Normalize unicode accents (e.g. café -> cafe)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace all non-alphanumeric characters with a dash
    .replace(/[^a-z0-9]+/g, '-')
    // Replace multiple consecutive dashes with a single dash
    .replace(/-+/g, '-')
    // Trim leading and trailing dashes
    .replace(/^-+|-+$/g, '');

  if (customSuffix) {
    const cleanSuffix = customSuffix.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (cleanSuffix && !slug.endsWith(cleanSuffix)) {
      slug = `${slug}-${cleanSuffix}`;
    }
  }

  return slug || 'product';
}
