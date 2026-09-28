/**
 * Generates a clean, SEO-friendly, professional URL slug from a product or category title.
 */
export function generateProfessionalSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
