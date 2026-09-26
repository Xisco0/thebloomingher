export type ProductStatus = 'draft' | 'active' | 'archived';

export interface Category {
  id: string;
  legacy_id?: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id?: string | null;
  display_order: number;
  is_active: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  total_products?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  title: string;
  price_override: number | null;
  stock_quantity: number;
  attributes?: Record<string, string>;
}

export interface Product {
  id: string;
  legacy_id?: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  cost_price?: number | null;
  currency: string;
  category_id: string | null;
  category_name: string | null;
  subcategory: string | null;
  short_description: string | null;
  description: string;
  features: string[];
  how_to_use?: string | null;
  ingredients?: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  status: ProductStatus;
  seo_title?: string | null;
  seo_description?: string | null;
  tags: string[];
  rating: number;
  rating_count: number;
  images: ProductImage[];
  variants?: ProductVariant[];
  stock_quantity: number;
  low_stock_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  is_verified_purchase: boolean;
  helpful_votes?: number;
}

export interface ProductFilterOptions {
  categorySlug?: string;
  collectionSlug?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  inStockOnly?: boolean;
  onSale?: boolean;
  minRating?: number;
  isBestseller?: boolean;
  isUnder10k?: boolean;
  isFeatured?: boolean;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'bestselling';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
