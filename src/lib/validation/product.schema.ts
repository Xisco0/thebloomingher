import { z } from 'zod';

export const ProductImageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  url: z.string().url('Image URL must be a valid URL'),
  alt_text: z.string().nullable().optional(),
  display_order: z.number().int().nonnegative().default(0),
  is_primary: z.boolean().default(false),
});

export const ProductVariantSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  sku: z.string().min(1, 'Variant SKU is required'),
  title: z.string().min(1, 'Variant title is required'),
  price_override: z.number().positive('Price override must be positive').nullable().optional(),
  stock_quantity: z.number().int().nonnegative('Stock quantity cannot be negative').default(0),
  attributes: z.record(z.string()).optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  legacy_id: z.number().optional(),
  name: z.string().min(2, 'Product name must have at least 2 characters'),
  slug: z.string().min(2, 'Slug must have at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  sku: z.string().min(2, 'SKU is required'),
  price: z.number().positive('Price must be greater than zero'),
  compare_at_price: z.number().positive().nullable().optional(),
  currency: z.string().default('NGN'),
  category_id: z.string().nullable().optional(),
  category_name: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  description: z.string().min(5, 'Description is required'),
  features: z.array(z.string()).default([]),
  how_to_use: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  is_featured: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'archived']).default('active'),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).default(5),
  rating_count: z.number().int().nonnegative().default(0),
  images: z.array(ProductImageSchema).min(1, 'Product must have at least one image'),
  variants: z.array(ProductVariantSchema).optional().default([]),
  stock_quantity: z.number().int().nonnegative('Stock quantity cannot be negative').default(0),
  low_stock_threshold: z.number().int().nonnegative().optional().default(5),
});

export type ValidatedProduct = z.infer<typeof ProductSchema>;

export function validateProduct(data: unknown): { success: boolean; data?: ValidatedProduct; errors?: string[] } {
  const result = ProductSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

export function validateCatalog(products: unknown[]): { valid: ValidatedProduct[]; invalid: { item: unknown; errors: string[] }[] } {
  const valid: ValidatedProduct[] = [];
  const invalid: { item: unknown; errors: string[] }[] = [];

  for (const item of products) {
    const res = validateProduct(item);
    if (res.success && res.data) {
      valid.push(res.data);
    } else {
      invalid.push({ item, errors: res.errors || ['Validation failed'] });
    }
  }

  return { valid, invalid };
}
