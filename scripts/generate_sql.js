const fs = require('fs');
const path = require('path');
const cat = require('../src/lib/data/catalog.json');

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (Array.isArray(val) || typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${val.toString().replace(/'/g, "''")}'`;
}

function sqlArrayEscape(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const items = arr.map(item => `"${item.toString().replace(/"/g, '\\"')}"`).join(',');
  return `'{${items}}'::text[]`;
}

let sql = `-- ==============================================================================
-- TheBloomingHer Care & Wellness — Complete Production Schema & Seed
-- Target: Supabase (PostgreSQL 15+)
-- Total Categories: ${cat.categories.length}
-- Total Products: ${cat.products.length}
-- ==============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. CORE CATALOG & SYSTEM TABLES
-- ==============================================================================

-- Drop existing tables to cleanly recreate consistent TEXT-ID schemas
DROP TABLE IF EXISTS public.product_reviews CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.marketing_banners CASCADE;
DROP TABLE IF EXISTS public.marketing_events CASCADE;
DROP TABLE IF EXISTS public.marketing_announcements CASCADE;
DROP TABLE IF EXISTS public.marketing_coupons CASCADE;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    legacy_id INT UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    legacy_id INT UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(12, 2) NOT NULL,
    compare_at_price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'NGN' NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(150),
    subcategory VARCHAR(150),
    short_description TEXT,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    how_to_use TEXT,
    ingredients TEXT,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    is_bestseller BOOLEAN DEFAULT false NOT NULL,
    is_new_arrival BOOLEAN DEFAULT false NOT NULL,
    status product_status DEFAULT 'active' NOT NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    tags TEXT[] DEFAULT '{}',
    rating DECIMAL(3, 2) DEFAULT 5.00 NOT NULL,
    rating_count INT DEFAULT 0 NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Product Images (Relational)
CREATE TABLE IF NOT EXISTS public.product_images (
    id TEXT PRIMARY KEY DEFAULT 'img_' || gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INT DEFAULT 0 NOT NULL,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY DEFAULT 'inv_' || gen_random_uuid(),
    product_id TEXT NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    stock_quantity INT DEFAULT 0 NOT NULL,
    low_stock_threshold INT DEFAULT 5 NOT NULL,
    allow_backorder BOOLEAN DEFAULT false NOT NULL,
    sku VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id TEXT PRIMARY KEY DEFAULT 'rev_' || gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    author_name VARCHAR(150) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT false NOT NULL,
    helpful_votes INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 3. CUSTOMER & USER ACCOUNTS
-- ==============================================================================

-- Profiles (synced with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'customer' NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    default_address JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT 'cust_' || gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    delivery_address JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ORDERS & CHECKOUT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'ord_' || gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN' NOT NULL,
    status order_status DEFAULT 'pending' NOT NULL,
    payment_status payment_status DEFAULT 'unpaid' NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'paystack' NOT NULL,
    paystack_reference VARCHAR(100),
    shipping_address JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT 'item_' || gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 5. ADMIN RBAC TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    role_name TEXT NOT NULL,
    role_slug TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    phone TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. CMS & MARKETING TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.marketing_banners (
    id TEXT PRIMARY KEY DEFAULT 'banner_' || gen_random_uuid(),
    title TEXT NOT NULL,
    highlighted_title TEXT,
    subtitle TEXT,
    badge_text TEXT,
    banner_type TEXT NOT NULL DEFAULT 'custom',
    placement TEXT NOT NULL DEFAULT 'homepage_hero',
    primary_cta JSONB,
    secondary_cta JSONB,
    desktop_image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    alt_text TEXT,
    priority_order INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    internal_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_events (
    id TEXT PRIMARY KEY DEFAULT 'event_' || gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL DEFAULT 'workshop',
    description TEXT,
    long_description TEXT,
    event_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    location TEXT NOT NULL,
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    virtual_meeting_url TEXT,
    registration_url TEXT,
    desktop_image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_announcements (
    id TEXT PRIMARY KEY DEFAULT 'ann_' || gen_random_uuid(),
    text TEXT NOT NULL,
    highlight_text TEXT,
    link_text TEXT,
    link_url TEXT,
    style_variant TEXT NOT NULL DEFAULT 'brand',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_coupons (
    id TEXT PRIMARY KEY DEFAULT 'coup_' || gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10,2) NOT NULL,
    minimum_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted read & write for configured clients & service role
DO $$ BEGIN
    CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
    CREATE POLICY "Allow write categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
    CREATE POLICY "Allow write products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read product_images" ON public.product_images FOR SELECT USING (true);
    CREATE POLICY "Allow write product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read inventory" ON public.inventory FOR SELECT USING (true);
    CREATE POLICY "Allow write inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read banners" ON public.marketing_banners FOR SELECT USING (true);
    CREATE POLICY "Allow write banners" ON public.marketing_banners FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read events" ON public.marketing_events FOR SELECT USING (true);
    CREATE POLICY "Allow write events" ON public.marketing_events FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read announcements" ON public.marketing_announcements FOR SELECT USING (true);
    CREATE POLICY "Allow write announcements" ON public.marketing_announcements FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow public read coupons" ON public.marketing_coupons FOR SELECT USING (true);
    CREATE POLICY "Allow write coupons" ON public.marketing_coupons FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Allow all on roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on product_reviews" ON public.product_reviews FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 8. SEED DATA
-- ==============================================================================

-- 8.1 CATEGORIES (${cat.categories.length} Total)
INSERT INTO public.categories (id, legacy_id, name, slug, description, image_url, display_order, is_active, seo_title, seo_description)
VALUES
`;

const catRows = cat.categories.map(c => {
  return `    (${sqlEscape(c.id)}, ${sqlEscape(c.legacy_id)}, ${sqlEscape(c.name)}, ${sqlEscape(c.slug)}, ${sqlEscape(c.description)}, ${sqlEscape(c.image_url)}, ${sqlEscape(c.display_order || 0)}, ${sqlEscape(c.is_active !== false)}, ${sqlEscape(c.seo_title)}, ${sqlEscape(c.seo_description)})`;
}).join(',\n');

sql += catRows + `\nON CONFLICT (id) DO UPDATE SET\n    name = EXCLUDED.name,\n    slug = EXCLUDED.slug,\n    description = EXCLUDED.description,\n    image_url = EXCLUDED.image_url;\n\n`;

// 8.2 PRODUCTS
sql += `-- 8.2 ALL PRODUCTS (${cat.products.length} Total)\nINSERT INTO public.products (id, legacy_id, name, slug, sku, price, compare_at_price, currency, category_id, category_name, subcategory, short_description, description, features, how_to_use, ingredients, is_featured, is_bestseller, is_new_arrival, status, seo_title, seo_description, tags, rating, rating_count, images)\nVALUES\n`;

const prodRows = cat.products.map(p => {
  const imageUrls = (p.images || []).map(img => typeof img === 'string' ? img : img.url);
  return `    (${sqlEscape(p.id)}, ${sqlEscape(p.legacy_id)}, ${sqlEscape(p.name)}, ${sqlEscape(p.slug)}, ${sqlEscape(p.sku)}, ${sqlEscape(p.price)}, ${sqlEscape(p.compare_at_price)}, ${sqlEscape(p.currency || 'NGN')}, ${sqlEscape(p.category_id)}, ${sqlEscape(p.category_name)}, ${sqlEscape(p.subcategory)}, ${sqlEscape(p.short_description)}, ${sqlEscape(p.description)}, ${sqlEscape(p.features || [])}, ${sqlEscape(p.how_to_use)}, ${sqlEscape(p.ingredients)}, ${sqlEscape(Boolean(p.is_featured))}, ${sqlEscape(Boolean(p.is_bestseller))}, ${sqlEscape(Boolean(p.is_new_arrival))}, 'active', ${sqlEscape(p.seo_title)}, ${sqlEscape(p.seo_description)}, ${sqlArrayEscape(p.tags)}, ${sqlEscape(p.rating || 5.0)}, ${sqlEscape(p.rating_count || 1)}, ${sqlEscape(imageUrls)})`;
}).join(',\n');

sql += prodRows + `\nON CONFLICT (id) DO UPDATE SET\n    name = EXCLUDED.name,\n    price = EXCLUDED.price,\n    compare_at_price = EXCLUDED.compare_at_price,\n    category_id = EXCLUDED.category_id,\n    category_name = EXCLUDED.category_name,\n    images = EXCLUDED.images;\n\n`;

// 8.3 PRODUCT IMAGES
sql += `-- 8.3 PRODUCT IMAGES (Relational)\nINSERT INTO public.product_images (id, product_id, url, alt_text, display_order, is_primary)\nVALUES\n`;

let imageRows = [];
cat.products.forEach(p => {
  if (p.images && Array.isArray(p.images)) {
    p.images.forEach((img, idx) => {
      const imgId = typeof img === 'object' && img.id ? img.id : `img_${p.id}_${idx}`;
      const url = typeof img === 'string' ? img : img.url;
      const alt = (typeof img === 'object' && img.alt_text) ? img.alt_text : `${p.name} - TheBloomingHer`;
      const isPrimary = (typeof img === 'object' && img.is_primary !== undefined) ? Boolean(img.is_primary) : (idx === 0);
      imageRows.push(`    (${sqlEscape(imgId)}, ${sqlEscape(p.id)}, ${sqlEscape(url)}, ${sqlEscape(alt)}, ${idx + 1}, ${sqlEscape(isPrimary)})`);
    });
  }
});

sql += imageRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n\n`;

// 8.4 INVENTORY
sql += `-- 8.4 INVENTORY (${cat.products.length} Total)\nINSERT INTO public.inventory (id, product_id, stock_quantity, low_stock_threshold, sku)\nVALUES\n`;

const invRows = cat.products.map(p => {
  const invId = `inv_${p.id}`;
  const stock = p.stock_quantity ?? 50;
  const lowStock = p.low_stock_threshold ?? 5;
  return `    (${sqlEscape(invId)}, ${sqlEscape(p.id)}, ${sqlEscape(stock)}, ${sqlEscape(lowStock)}, ${sqlEscape(p.sku)})`;
}).join(',\n');

sql += invRows + `\nON CONFLICT (product_id) DO UPDATE SET\n    stock_quantity = EXCLUDED.stock_quantity,\n    low_stock_threshold = EXCLUDED.low_stock_threshold;\n\n`;

// 8.5 RBAC & ADMINS
sql += `-- 8.5 RBAC ROLES
INSERT INTO public.roles (id, name, slug, description, permissions, is_system)
VALUES
    ('role-super-admin', 'Super Administrator', 'super_admin', 'Full platform control, access to system settings, development features, and database management.', '["*"]'::jsonb, true),
    ('role-store-admin', 'Store Administrator', 'admin', 'Store operations, product catalog, customer management, orders, discounts, and marketing content.', '["dashboard:view","analytics:view","orders:view","orders:edit","products:view","products:create","products:edit","products:delete","inventory:view","inventory:manage","categories:manage","customers:view","reviews:manage","cms:view","cms:edit","marketing:view","marketing:manage"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    permissions = EXCLUDED.permissions;

-- 8.6 ADMIN ACCOUNTS
-- Francis (SuperAdmin Developer): francisbamirin45@gmail.com / Olaski61!
-- Store Admin: thebloomingherwellness@gmail.com / blooming123
INSERT INTO public.admin_users (id, email, password_hash, first_name, last_name, full_name, role_id, role_name, role_slug, status, is_active, must_change_password)
VALUES
    ('admin-super-francis', 'francisbamirin45@gmail.com', '$2a$10$vO4dG2qI1o3n3Z7m8n.q7uBvKjD1y3z8s7l4a1v5y8t1l9n8q7uBv', 'Francis', 'Bamirin', 'Francis Bamirin', 'role-super-admin', 'Super Administrator', 'super_admin', 'active', true, false),
    ('admin-store-wellness', 'thebloomingherwellness@gmail.com', '$2a$10$tZ1KkP1qVzY5QJ6M6VbYTeuV0lWv1oM4Z5o9j6nK5Fh3d6b9qZ5y6', 'BloomingHer', 'StoreAdmin', 'BloomingHer Store Admin', 'role-store-admin', 'Store Administrator', 'admin', 'active', true, false)
ON CONFLICT (email) DO NOTHING;

-- 8.7 CMS HERO BANNERS
INSERT INTO public.marketing_banners (id, title, highlighted_title, subtitle, badge_text, banner_type, placement, primary_cta, secondary_cta, desktop_image_url, mobile_image_url, alt_text, priority_order, status, internal_name)
VALUES
    ('banner_hero_1', 'Comfort, Confidence &', 'Gentle Period Wellness', 'From intelligent menstrual cramp relief belts to organic cotton hygiene essentials, we empower every woman with doctor-approved comfort.', '✨ Nigeria''s #1 Trusted Feminine Care', 'custom', 'homepage_hero', '{"text":"Shop Best Sellers","url":"/shop"}'::jsonb, '{"text":"Relieve Cramp Pain","url":"/categories/comfort-relaxation"}'::jsonb, 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'TheBloomingHer Hero Banner', 1, 'active', 'Homepage Primary Hero Showcase')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle;

-- 8.8 CMS EVENTS
INSERT INTO public.marketing_events (id, name, slug, event_type, description, long_description, event_date, start_time, end_time, location, is_virtual, registration_url, desktop_image_url, mobile_image_url, status, is_featured)
VALUES
    ('event_wellness_day_2026', 'BloomingHer Wellness Day 2026', 'bloomingher-wellness-day-2026', 'wellness_day', 'Join hundreds of women for doctor-led pelvic health sessions, menstrual masterclasses, sound bath therapy, and curated self-care kits.', 'A full-day immersive sanctuary dedicated to women''s health, cycle comfort, and bodily rest in Ikeja, Lagos.', '2026-10-18', '10:00 AM', '4:00 PM', 'Radisson Blu Anchorage, Victoria Island, Lagos', false, 'https://www.thebloomingher.com/events/bloomingher-wellness-day-2026', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'active', true),
    ('event_cycle_care_masterclass', 'Menstrual Health & Hormone Masterclass', 'cycle-care-masterclass', 'workshop', 'A virtual interactive session led by gynecologists on understanding your luteal phase, managing endometriosis symptoms, and cycle nutrition.', 'Learn practical tools and habits to align your diet, work, and exercise with your hormonal rhythm.', '2026-11-05', '6:00 PM', '8:00 PM', 'Online Zoom Event', true, 'https://www.thebloomingher.com/events/cycle-care-masterclass', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 8.9 ANNOUNCEMENTS
INSERT INTO public.marketing_announcements (id, text, highlight_text, link_text, link_url, style_variant, status)
VALUES
    ('ann_free_shipping', '✨ FREE Lagos Doorstep Delivery on orders over ₦40,000 | Same-Day Lagos Dispatch Available', 'FREE Lagos Delivery', 'Shop Now', '/shop', 'brand', 'active')
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text;

-- 8.10 COUPONS
INSERT INTO public.marketing_coupons (id, code, title, description, discount_type, discount_value, minimum_spend, status)
VALUES
    ('coup_welcome10', 'BLOOM10', 'Welcome 10% Off', '10% off your first order over ₦15,000', 'percentage', 10.00, 15000.00, 'active'),
    ('coup_comfort5k', 'COMFORT5K', '₦5,000 Off Heating Belt Bundles', '₦5,000 off orders containing menstrual heating belts above ₦30,000', 'fixed_amount', 5000.00, 30000.00, 'active')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title;
`;

const outputPath = path.join(__dirname, '../supabase/schema_and_seed.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log('Successfully generated schema_and_seed.sql with ' + cat.products.length + ' products and ' + cat.categories.length + ' categories.');
