-- Migration 003: High-Performance Catalog Indexes & Full-Text Search
-- Optimizes product discovery, category lookups, price sorting, and search queries

-- 1. Index on Product Slugs (Unique & fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);

-- 2. Index on SKU
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

-- 3. Composite Index on Category and Status for fast catalog browsing
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products (category_id, status) WHERE status = 'active';

-- 4. Indexes for sorting & filtering
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON products (is_bestseller) WHERE is_bestseller = true;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_rating ON products (rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);

-- 5. Full-Text Search (GIN) Index for intelligent keyword lookups
-- Combines product name, description, category_name, and tags
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(category_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(short_description, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'D')
) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);

-- 6. Category Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories (display_order);

-- 7. Product Images Index
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id, display_order);

-- 8. Reviews Index
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews (product_id, rating DESC, created_at DESC);
