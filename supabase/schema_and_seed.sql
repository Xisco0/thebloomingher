-- ==============================================================================
-- TheBloomingHer Care & Wellness — Complete Production Schema & Seed
-- Target: Supabase (PostgreSQL 15+)
-- Total Categories: 5
-- Total Products: 54
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

-- 8.1 CATEGORIES (5 Total)
INSERT INTO public.categories (id, legacy_id, name, slug, description, image_url, display_order, is_active, seo_title, seo_description)
VALUES
    ('cat-18145', 18145, 'Wellness & Body Care', 'wellness-body-care', 'Thoughtfully curated wellness & body care products for your everyday comfort and health.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778404649/rcy2hfmeanadciu5ecws.jpg', 1, true, 'Wellness & Body Care Products in Nigeria | TheBloomingHer', 'Shop authentic wellness & body care in Lagos & across Nigeria. High quality, comforting essentials delivered to your doorstep.'),
    ('cat-18130', 18130, 'Feminine Care', 'feminine-care', 'Thoughtfully curated feminine care products for your everyday comfort and health.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789338151/kb1mlsxmyh35qiewtrro.jpg', 2, true, 'Feminine Care Products in Nigeria | TheBloomingHer', 'Shop authentic feminine care in Lagos & across Nigeria. High quality, comforting essentials delivered to your doorstep.'),
    ('cat-18133', 18133, 'Everyday Essentials', 'everyday-essentials', 'Thoughtfully curated everyday essentials products for your everyday comfort and health.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg', 3, true, 'Everyday Essentials Products in Nigeria | TheBloomingHer', 'Shop authentic everyday essentials in Lagos & across Nigeria. High quality, comforting essentials delivered to your doorstep.'),
    ('cat-18131', 18131, 'Comfort & Relaxation', 'comfort-relaxation', 'Thoughtfully curated comfort & relaxation products for your everyday comfort and health.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392317/mo2xpti2h9b6qvsuv0u8.jpg', 4, true, 'Comfort & Relaxation Products in Nigeria | TheBloomingHer', 'Shop authentic comfort & relaxation in Lagos & across Nigeria. High quality, comforting essentials delivered to your doorstep.'),
    ('cat-18132', 18132, 'Beauty & Self-Care', 'beauty-self-care', 'Thoughtfully curated beauty & self-care products for your everyday comfort and health.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777922535/wcdwg9lj9vukg7v618xt.jpg', 5, true, 'Beauty & Self-Care Products in Nigeria | TheBloomingHer', 'Shop authentic beauty & self-care in Lagos & across Nigeria. High quality, comforting essentials delivered to your doorstep.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- 8.2 ALL PRODUCTS (54 Total)
INSERT INTO public.products (id, legacy_id, name, slug, sku, price, compare_at_price, currency, category_id, category_name, subcategory, short_description, description, features, how_to_use, ingredients, is_featured, is_bestseller, is_new_arrival, status, seo_title, seo_description, tags, rating, rating_count, images)
VALUES
    ('prod-33818', 33818, 'Uzana Pocket Tissue', 'uzana-pocket-tissue-33818', 'UZ266828', 2500, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gift Ideas', 'Quality uzana pocket tissue designed for your comfort and everyday care.', 'The Uzana Pocket Tissue is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, false, true, 'active', 'Uzana Pocket Tissue | TheBloomingHer Nigeria', 'Buy Uzana Pocket Tissue in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 11, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg"]'::jsonb),
    ('prod-24207', 24207, 'Hand Cream', 'hand-cream-24207', 'HA622148', 450, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Hand & Lip Care', 'Quality hand cream designed for your comfort and everyday care.', 'The Hand Cream is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, false, false, 'active', 'Hand Cream | TheBloomingHer Nigeria', 'Buy Hand Cream in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 19, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497628/pd6qgwj1y7r81jkkcsi3.png"]'::jsonb),
    ('prod-24168', 24168, 'Under eye Mask', 'under-eye-mask-24168', 'UN072809', 400, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Face Care', 'Quality under eye mask designed for your comfort and everyday care.', 'The Under eye Mask is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, false, false, 'active', 'Under eye Mask | TheBloomingHer Nigeria', 'Buy Under eye Mask in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 13, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1777922535/wcdwg9lj9vukg7v618xt.jpg"]'::jsonb),
    ('prod-25025', 25025, 'Mini Storage Basket', 'mini-storage-basket-25025', 'MI515919', 700, 840, 'NGN', 'cat-18133', 'Everyday Essentials', 'Home Essentials', 'Quality mini storage basket designed for your comfort and everyday care.', 'mini storage basket', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, false, false, 'active', 'Mini Storage Basket | TheBloomingHer Nigeria', 'Buy Mini Storage Basket in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778598055/uanszbraoqcjcfsnqakp.jpg"]'::jsonb),
    ('prod-33817', 33817, 'Pure Love Pant Liner', 'pure-love-pant-liner-33817', 'PU987261', 1550, NULL, 'NGN', 'cat-18130', 'Feminine Care', 'Period Essentials', 'Quality pure love pant liner designed for your comfort and everyday care.', 'The Pure Love Pant Liner is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, false, false, 'active', 'Pure Love Pant Liner | TheBloomingHer Nigeria', 'Buy Pure Love Pant Liner in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 21, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430783/jsdi2fa0bmejsr98gq3x.jpg"]'::jsonb),
    ('prod-33812', 33812, 'Rechargeable Kiki Clipper', 'rechargeable-kiki-clipper-33812', 'RE011959', 18000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gifts for Him', 'Quality rechargeable kiki clipper designed for your comfort and everyday care.', 'Rechargeable Kiki Clipper', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, false, true, 'active', 'Rechargeable Kiki Clipper | TheBloomingHer Nigeria', 'Buy Rechargeable Kiki Clipper in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 14, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789396491/qst76cbeomcu4liwkcp4.jpg"]'::jsonb),
    ('prod-24227', 24227, 'Probiotics Gummies', 'probiotics-gummies-24227', 'PR850386', 7500, 9000, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Wellness Essentials', 'Quality probiotics gummies designed for your comfort and everyday care.', 'probiotics for women', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', true, false, false, 'active', 'Probiotics Gummies | TheBloomingHer Nigeria', 'Buy Probiotics Gummies in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 17, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1777986252/gbw3rkqyoaq8wunom5hz.jpg"]'::jsonb),
    ('prod-33776', 33776, 'Shoe Wipes', 'shoe-wipes-33776', 'SH717925', 2500, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Home Essentials', 'Quality shoe wipes designed for your comfort and everyday care.', 'Wet shoe wipes for shoes and sneakers', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', true, true, false, 'active', 'Shoe Wipes | TheBloomingHer Nigeria', 'Buy Shoe Wipes in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 20, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325669/o0rl01b8oanaklazaiha.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325672/xbffbgb5r92m2tmfe1kl.jpg"]'::jsonb),
    ('prod-33772', 33772, 'Electric Fan', 'electric-fan-33772', 'EL291613', 35000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Home Essentials', 'Quality electric fan designed for your comfort and everyday care.', 'The Electric Fan is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Electric Fan | TheBloomingHer Nigeria', 'Buy Electric Fan in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325074/c0oa1vq0thpjvqhm6fsh.jpg"]'::jsonb),
    ('prod-33777', 33777, 'White Towel', 'white-towel-33777', 'WH112278', 13500, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Towels & Textiles', 'Quality white towel designed for your comfort and everyday care.', 'XL white body towel', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'White Towel | TheBloomingHer Nigeria', 'Buy White Towel in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 7, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325900/wolchtgo2ob16misserm.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325904/lb1d9zcxxdpsfpq52buq.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325909/ngi8clslbmvgm1wo6gus.jpg"]'::jsonb),
    ('prod-33768', 33768, 'Pocket Perfume', 'pocket-perfume-33768', 'PO309942', 1800, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Self-Care Accessories', 'Quality pocket perfume designed for your comfort and everyday care.', 'The Pocket Perfume is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Pocket Perfume | TheBloomingHer Nigeria', 'Buy Pocket Perfume in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 14, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789324803/uyqbuvqgeqtwhfl1it49.jpg"]'::jsonb),
    ('prod-22359', 22359, 'Vitamin C', 'vitamin-c-22359', 'VI938106', 3500, 4200, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Wellness Essentials', 'Quality vitamin c designed for your comfort and everyday care.', 'The Vitamin C is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, false, false, 'active', 'Vitamin C | TheBloomingHer Nigeria', 'Buy Vitamin C in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1776956999/bdnfrvva2grsoy6zjswz.jpg"]'::jsonb),
    ('prod-33854', 33854, 'Tongue Scrapper', 'tongue-scrapper-33854', 'TO948430', 900, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Self-Care Accessories', 'Quality tongue scrapper designed for your comfort and everyday care.', 'The Tongue Scrapper is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Tongue Scrapper | TheBloomingHer Nigeria', 'Buy Tongue Scrapper in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497304/hdxognccprylxi5dg60o.png"]'::jsonb),
    ('prod-22358', 22358, 'Menstrual Heating Belt', 'menstrual-heating-belt-22358', 'ME275019', 11500, 13800, 'NGN', 'cat-18130', 'Feminine Care', 'Period Comfort', 'Quality menstrual heating belt designed for your comfort and everyday care.', 'relief for period cramps', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, true, false, 'active', 'Menstrual Heating Belt | TheBloomingHer Nigeria', 'Buy Menstrual Heating Belt in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 9, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789338151/kb1mlsxmyh35qiewtrro.jpg"]'::jsonb),
    ('prod-26789', 26789, 'Can Wet Wipes', 'can-wet-wipes-26789', 'CA170925', 1500, NULL, 'NGN', 'cat-18130', 'Feminine Care', 'Feminine Hygiene', 'Quality can wet wipes designed for your comfort and everyday care.', 'The Can Wet Wipes is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Can Wet Wipes | TheBloomingHer Nigeria', 'Buy Can Wet Wipes in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 20, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1780333900/qmknqfohdnxd2sbm7dte.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1780333897/ycgrufjcfmaeyumyev4a.jpg"]'::jsonb),
    ('prod-24730', 24730, 'Probiotics Cranberry Gummies', 'probiotics-cranberry-gummies-24730', 'PR451052', 7500, 9000, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Wellness Essentials', 'Quality probiotics cranberry gummies designed for your comfort and everyday care.', 'The Probiotics Cranberry Gummies is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, true, true, 'active', 'Probiotics Cranberry Gummies | TheBloomingHer Nigeria', 'Buy Probiotics Cranberry Gummies in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 7, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778404649/rcy2hfmeanadciu5ecws.jpg"]'::jsonb),
    ('prod-24500', 24500, 'Soft Care Sanitary Pad', 'soft-care-sanitary-pad-24500', 'SO908201', 620, NULL, 'NGN', 'cat-18130', 'Feminine Care', 'Period Essentials', 'Quality soft care sanitary pad designed for your comfort and everyday care.', 'The Soft Care Sanitary Pad is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Soft Care Sanitary Pad | TheBloomingHer Nigeria', 'Buy Soft Care Sanitary Pad in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 20, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778161593/xkpux3tu1vhvya7592nt.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1778161595/izqu3r9s4g3msllf7unz.jpg"]'::jsonb),
    ('prod-33821', 33821, 'Tampons', 'tampons-33821', 'TA061637', 8000, NULL, 'NGN', 'cat-18130', 'Feminine Care', 'Period Essentials', 'Quality tampons designed for your comfort and everyday care.', 'The Tampons is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Tampons | TheBloomingHer Nigeria', 'Buy Tampons in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 9, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789431214/wqil2xikhrm6x2zt7lr5.jpg"]'::jsonb),
    ('prod-24456', 24456, 'Comfort Package', 'comfort-package-24456', 'CO326533', 25000, 30000, 'NGN', 'cat-18130', 'Feminine Care', 'Period Care Packages', 'Quality comfort package designed for your comfort and everyday care.', 'Package includes: 
3 Sanitary Pads
1 Roll-On
1 Panty Liner
1 Period Panties
2 Herbal Tea
1 Neurogesic Methylated Cream
2 Facial Mask
2 Pocket Tissue
1 Hand Cream
1 Undereye Mask 
1 Teatree wipes 
2 soft care wipes 
1 mini hot water bottle 
1 lip balm 
1 Vaseline
Sweet Treat and a free gift', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Comfort Package | TheBloomingHer Nigeria', 'Buy Comfort Package in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 7, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789330041/csnn5mryxreqieybqs4x.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789330046/lqsiic9bpvksbllt67ke.jpg"]'::jsonb),
    ('prod-24228', 24228, 'Neurogesic Cream', 'neurogesic-cream-24228', 'NE512835', 1950, 2340, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Period Care Essentials', 'Quality neurogesic cream designed for your comfort and everyday care.', 'relief cream for cramps', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, false, false, 'active', 'Neurogesic Cream | TheBloomingHer Nigeria', 'Buy Neurogesic Cream in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 24, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1777986407/f0yf3e7tvnfzhwtcywny.jpg"]'::jsonb),
    ('prod-25032', 25032, 'Jewelry Box', 'jewelry-box-25032', 'JE472728', 3999.99, 4799.987999999999, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Self-Care Accessories', 'Quality jewelry box designed for your comfort and everyday care.', 'The Jewelry Box is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Jewelry Box | TheBloomingHer Nigeria', 'Buy Jewelry Box in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 23, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778598610/j0mvpbho8ves3drtiqav.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1782149548/v56fufpxclu8aqnvmdwz.jpg"]'::jsonb),
    ('prod-24285', 24285, 'Soft care Mini Wipes', 'soft-care-mini-wipes-24285', 'SO122778', 500, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Self-Care Accessories', 'Quality soft care mini wipes designed for your comfort and everyday care.', 'The Soft care Mini Wipes is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Soft care Mini Wipes | TheBloomingHer Nigeria', 'Buy Soft care Mini Wipes in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 16, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778022168/finnr552lfgq1zbft4rt.jpg"]'::jsonb),
    ('prod-33820', 33820, 'Reusable Tissue', 'reusable-tissue-33820', 'RE290135', 2700, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Home Essentials', 'Quality reusable tissue designed for your comfort and everyday care.', 'The Reusable Tissue is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Reusable Tissue | TheBloomingHer Nigeria', 'Buy Reusable Tissue in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 13, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789431153/grrgds6zefoibivpgmqf.jpg"]'::jsonb),
    ('prod-33796', 33796, 'Blueidea Clipper', 'blueidea-clipper-33796', 'BL056223', 9000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gifts for Him', 'Quality blueidea clipper designed for your comfort and everyday care.', 'Clipper for shaving', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Blueidea Clipper | TheBloomingHer Nigeria', 'Buy Blueidea Clipper in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 9, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789383046/zeaouarsbxvbibwrjioj.jpg"]'::jsonb),
    ('prod-33769', 33769, 'Coffee Cup', 'coffee-cup-33769', 'CO859172', 7500, NULL, 'NGN', 'cat-18131', 'Comfort & Relaxation', 'Heat & Comfort', 'Quality coffee cup designed for your comfort and everyday care.', 'coffee cup with heating pad', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, true, false, 'active', 'Coffee Cup | TheBloomingHer Nigeria', 'Buy Coffee Cup in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"comfort & relaxation","wellness","nigeria","self-care"}'::text[], 5, 17, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789324879/btjsehm33lk41pouplvf.jpg"]'::jsonb),
    ('prod-25018', 25018, 'Glass Tea Cup', 'glass-tea-cup-25018', 'GL850370', 2000, 2400, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gift Ideas', 'Quality glass tea cup designed for your comfort and everyday care.', 'glass tea cup with handle', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Glass Tea Cup | TheBloomingHer Nigeria', 'Buy Glass Tea Cup in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 20, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778597430/yimfsxgdi2cu7uetpyaf.jpg"]'::jsonb),
    ('prod-33842', 33842, 'Collagen Foot Mask', 'collagen-foot-mask-33842', 'CO835544', 2000, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Nail & Grooming', 'Quality collagen foot mask designed for your comfort and everyday care.', 'The Collagen Foot Mask is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Collagen Foot Mask | TheBloomingHer Nigeria', 'Buy Collagen Foot Mask in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 16, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497525/byeztq51lhjax8kuuuuc.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496055/a4dg09lvfctn9iaawnrx.png"]'::jsonb),
    ('prod-33852', 33852, 'Boob Tape', 'boob-tape-33852', 'BO954068', 4000, NULL, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Body Care', 'Quality boob tape designed for your comfort and everyday care.', 'boob tape for backless dress', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, false, false, 'active', 'Boob Tape | TheBloomingHer Nigeria', 'Buy Boob Tape in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 16, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497117/g5fj963tsmfvi1yf6bdq.png"]'::jsonb),
    ('prod-24941', 24941, 'Paloma Tissue', 'paloma-tissue-24941', 'PA980594', 3050, 3660, 'NGN', 'cat-18133', 'Everyday Essentials', 'Travel & On - The - Go', 'Quality paloma tissue designed for your comfort and everyday care.', '<p>A pack of 10 mini packs of pocket tissue. 100 in total</p>', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Paloma Tissue | TheBloomingHer Nigeria', 'Buy Paloma Tissue in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 23, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778500586/jrga8gygyqjvypg2x7kx.webp","https://res.cloudinary.com/dld8u8zjg/image/upload/v1778500586/s6xwpv72pqoevuiucbai.webp"]'::jsonb),
    ('prod-33857', 33857, 'Lip Scrubber', 'lip-scrubber-33857', 'LI689967', 700, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Hand & Lip Care', 'Quality lip scrubber designed for your comfort and everyday care.', 'The Lip Scrubber is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Lip Scrubber | TheBloomingHer Nigeria', 'Buy Lip Scrubber in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497543/cjfewdj5qpy5jbsh460b.jpg"]'::jsonb),
    ('prod-33806', 33806, 'Hot Water Bottle', 'hot-water-bottle-33806', 'HO883177', 9000, NULL, 'NGN', 'cat-18131', 'Comfort & Relaxation', 'Heat & Comfort', 'Quality hot water bottle designed for your comfort and everyday care.', 'hot water bottle for cramps relief', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Hot Water Bottle | TheBloomingHer Nigeria', 'Buy Hot Water Bottle in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"comfort & relaxation","wellness","nigeria","self-care"}'::text[], 5, 13, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392317/mo2xpti2h9b6qvsuv0u8.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392321/felkhprbpdyp9sbos8bc.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392325/yvgehlr2l8fkhmw78fwu.jpg"]'::jsonb),
    ('prod-33845', 33845, 'Teeth Whitening Strip', 'teeth-whitening-strip-33845', 'TE570256', 5000, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Self-Care Accessories', 'Quality teeth whitening strip designed for your comfort and everyday care.', 'teeth whitening strip', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Teeth Whitening Strip | TheBloomingHer Nigeria', 'Buy Teeth Whitening Strip in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 7, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496301/fro1hmlcouwvxcdtic21.png"]'::jsonb),
    ('prod-33855', 33855, 'Perfume', 'perfume-33855', 'PE605099', 2500, NULL, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Body Care', 'Quality perfume designed for your comfort and everyday care.', 'The Perfume is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, false, false, 'active', 'Perfume | TheBloomingHer Nigeria', 'Buy Perfume in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 13, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497361/bm0iucgsmcqq9v4h7nti.png"]'::jsonb),
    ('prod-33858', 33858, 'Foot Scrubber', 'foot-scrubber-33858', 'FO477511', 2000, NULL, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Body Care', 'Quality foot scrubber designed for your comfort and everyday care.', 'The Foot Scrubber is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, false, false, 'active', 'Foot Scrubber | TheBloomingHer Nigeria', 'Buy Foot Scrubber in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 13, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497785/bfveqecuhdemgcgtlsim.jpg"]'::jsonb),
    ('prod-33770', 33770, 'Toothbrush Case', 'toothbrush-case-33770', 'TO928617', 1500, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Home Essentials', 'Quality toothbrush case designed for your comfort and everyday care.', 'Mini Toothbrush And Toothpaste case', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Toothbrush Case | TheBloomingHer Nigeria', 'Buy Toothbrush Case in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 15, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789324968/vitp1a2dlblybxjixsgs.jpg"]'::jsonb),
    ('prod-33813', 33813, 'Colored Body Towel', 'colored-body-towel-33813', 'CO139615', 10000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Towels & Textiles', 'Quality colored body towel designed for your comfort and everyday care.', 'Colored body towel', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Colored Body Towel | TheBloomingHer Nigeria', 'Buy Colored Body Towel in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 24, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789396654/pjqy5looy2cc9feea7ok.jpg"]'::jsonb),
    ('prod-33773', 33773, 'Gym/Sport Bottle', 'gymsport-bottle-33773', 'GY102130', 7000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Fitness & Hydration', 'Quality gym/sport bottle designed for your comfort and everyday care.', 'Water Bottle for gym/sports purposes', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, true, false, 'active', 'Gym/Sport Bottle | TheBloomingHer Nigeria', 'Buy Gym/Sport Bottle in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 20, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325124/mdgu8whuszlqevynmd6f.jpg"]'::jsonb),
    ('prod-33846', 33846, 'Pimple Patches', 'pimple-patches-33846', 'PI610751', 600, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Face Care', 'Quality pimple patches designed for your comfort and everyday care.', 'The Pimple Patches is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Pimple Patches | TheBloomingHer Nigeria', 'Buy Pimple Patches in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 6, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496402/o9qayph9km9ndq9u6nc9.png"]'::jsonb),
    ('prod-33844', 33844, 'Toner Pads', 'toner-pads-33844', 'TO223649', 2500, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Self-Care Accessories', 'Quality toner pads designed for your comfort and everyday care.', 'The Toner Pads is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Toner Pads | TheBloomingHer Nigeria', 'Buy Toner Pads in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 21, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496207/dkkohlraypfyyxkgwa8f.png"]'::jsonb),
    ('prod-25024', 25024, 'Lip Mask', 'lip-mask-25024', 'LI975540', 400, NULL, 'NGN', 'cat-18132', 'Beauty & Self-Care', 'Hand & Lip Care', 'Quality lip mask designed for your comfort and everyday care.', '<p>lip mask for lip care</p>', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Lip Mask | TheBloomingHer Nigeria', 'Buy Lip Mask in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"beauty & self-care","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778597967/mjcis39bhx4o1jvp7jsk.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1778597966/wrzt1phpqhjfcojz1tm0.png"]'::jsonb),
    ('prod-33999', 33999, 'Botare Pocket Tissue', 'botare-pocket-tissue-33999', 'BO048023', 2500, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gift Ideas', 'Quality botare pocket tissue designed for your comfort and everyday care.', 'pocket tissue 
12 mini packs in a bag', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Botare Pocket Tissue | TheBloomingHer Nigeria', 'Buy Botare Pocket Tissue in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 9, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789796290/cqmhzl69hevqhlploon6.jpg"]'::jsonb),
    ('prod-24457', 24457, 'Premium Period Care Package', 'premium-period-care-package-24457', 'PR116580', 32000, 38400, 'NGN', 'cat-18130', 'Feminine Care', 'Period Care Packages', 'Quality premium period care package designed for your comfort and everyday care.', 'Package includes:
1 Big Sanitary pad
1 Panty liner
2 Teatree Wipes
1 Big Hot water bottle
3 Pocket Tissues
2 Herbal Tea
3 Facial masks
2 under eye masks
1 Roll on 
1 Body spray
1 Hand cream  
1 Folic acid
1 lip balm 
1 Vaseline
Sweet Treats and a free gift', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Premium Period Care Package | TheBloomingHer Nigeria', 'Buy Premium Period Care Package in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789330003/mawebpvw0q1wuyo0hixl.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1789329981/m3c8lytz26yben0dbr0z.jpg"]'::jsonb),
    ('prod-33819', 33819, 'Disposable Pants', 'disposable-pants-33819', 'DI149078', 3500, NULL, 'NGN', 'cat-18130', 'Feminine Care', 'Period Comfort', 'Quality disposable pants designed for your comfort and everyday care.', 'The Disposable Pants is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Disposable Pants | TheBloomingHer Nigeria', 'Buy Disposable Pants in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 10, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430919/sq1gl48xjz7unklbeqmv.jpg"]'::jsonb),
    ('prod-26798', 26798, '3-month Bloomie Package', '3-month-bloomie-package-26798', 'MO251074', 18200, 21840, 'NGN', 'cat-18130', 'Feminine Care', 'Period Care Packages', 'Quality 3-month bloomie package designed for your comfort and everyday care.', 'this package will last you for 3 months as it contains enough sanitary essentials such as sanitary pads, pant liners, wipes, tissues etc', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, true, false, 'active', '3-month Bloomie Package | TheBloomingHer Nigeria', 'Buy 3-month Bloomie Package in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 23, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1780338538/jizbgpbxciilirdi4xf8.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1782149812/zq8lvhpxzzeqeiut3jru.jpg","https://res.cloudinary.com/dld8u8zjg/image/upload/v1782149817/a6gbwkwsezvhbtj2whjj.jpg"]'::jsonb),
    ('prod-33860', 33860, 'Herbal Tea', 'herbal-tea-33860', 'HE834327', 5000, NULL, 'NGN', 'cat-18145', 'Wellness & Body Care', 'Wellness Teas', 'Quality herbal tea designed for your comfort and everyday care.', 'herbal tea for cramps', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Natural botanicals, essential vitamins & active wellness ingredients.', false, false, false, 'active', 'Herbal Tea | TheBloomingHer Nigeria', 'Buy Herbal Tea in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"wellness & body care","wellness","nigeria","self-care"}'::text[], 5, 15, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789498019/xy6roqeqj4nimrirq3yi.jpg"]'::jsonb),
    ('prod-33850', 33850, 'Glow In The Dark', 'glow-in-the-dark-33850', 'GL688919', 1200, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Home Essentials', 'Quality glow in the dark designed for your comfort and everyday care.', 'The Glow In The Dark is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Glow In The Dark | TheBloomingHer Nigeria', 'Buy Glow In The Dark in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 14, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496833/jla2k76uzdqhplpafhgi.png"]'::jsonb),
    ('prod-33778', 33778, 'Gym Towel', 'gym-towel-33778', 'GY138628', 5000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Fitness & Hydration', 'Quality gym towel designed for your comfort and everyday care.', 'The Gym Towel is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, true, false, 'active', 'Gym Towel | TheBloomingHer Nigeria', 'Buy Gym Towel in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 17, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325969/phisnp2t3nxtmqlzhnhc.png"]'::jsonb),
    ('prod-24224', 24224, 'Period Care Package', 'period-care-package-24224', 'PE406671', 15000, 18000, 'NGN', 'cat-18130', 'Feminine Care', 'Period Care Packages', 'Quality period care package designed for your comfort and everyday care.', 'period care package', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, true, false, 'active', 'Period Care Package | TheBloomingHer Nigeria', 'Buy Period Care Package in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 7, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1777981987/h63bciol2cozwyw3zuss.jpg"]'::jsonb),
    ('prod-33856', 33856, 'Hair Claws', 'hair-claws-33856', 'HA133832', 1000, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gift Ideas', 'Quality hair claws designed for your comfort and everyday care.', 'The Hair Claws is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Hair Claws | TheBloomingHer Nigeria', 'Buy Hair Claws in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 16, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497462/hxvie8bnp6abptjy2f0l.png"]'::jsonb),
    ('prod-24229', 24229, 'Pocket Tissue', 'pocket-tissue-24229', 'PO749170', 1700, 2040, 'NGN', 'cat-18133', 'Everyday Essentials', 'Travel & On - The - Go', 'Quality pocket tissue designed for your comfort and everyday care.', 'The Pocket Tissue is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Pocket Tissue | TheBloomingHer Nigeria', 'Buy Pocket Tissue in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 12, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1777986728/q6kyprwaxuhfklf2vgjk.jpg"]'::jsonb),
    ('prod-24502', 24502, 'Soft Care Roll', 'soft-care-roll-24502', 'SO791836', 2750, 3300, 'NGN', 'cat-18130', 'Feminine Care', 'Period Essentials', 'Quality soft care roll designed for your comfort and everyday care.', 'A roll of Softcare sanitary pads', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Soft Care Roll | TheBloomingHer Nigeria', 'Buy Soft Care Roll in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"feminine care","wellness","nigeria","self-care"}'::text[], 5, 19, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1778162377/l23nchhtlzc5uipbru2q.jpg"]'::jsonb),
    ('prod-24235', 24235, 'Neck Pillow', 'neck-pillow-24235', 'NE903045', 7000, 8400, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gift Ideas', 'Quality neck pillow designed for your comfort and everyday care.', 'The Neck Pillow is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Neck Pillow | TheBloomingHer Nigeria', 'Buy Neck Pillow in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 18, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1777988366/nptxv8nge2ssijrzwzry.jpg"]'::jsonb),
    ('prod-33849', 33849, 'Rabbit Phone Holder', 'rabbit-phone-holder-33849', 'RA510819', 2500, NULL, 'NGN', 'cat-18133', 'Everyday Essentials', 'Gift Ideas', 'Quality rabbit phone holder designed for your comfort and everyday care.', 'The Rabbit Phone Holder is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, false, 'active', 'Rabbit Phone Holder | TheBloomingHer Nigeria', 'Buy Rabbit Phone Holder in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"everyday essentials","wellness","nigeria","self-care"}'::text[], 5, 23, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496698/scmztlbn8fbnb2ukn3ov.png"]'::jsonb),
    ('prod-33843', 33843, 'Foot Cream', 'foot-cream-33843', 'FO548219', 1800, NULL, 'NGN', 'cat-18131', 'Comfort & Relaxation', 'Relaxation Essentials', 'Quality foot cream designed for your comfort and everyday care.', 'The Foot Cream is thoughtfully designed and selected for quality, comfort, and everyday utility. Ideal for modern women seeking practical wellness and reliable care.', '["100% Quality Inspected","Comfortable & Easy to Use","Suitable for Daily Care & Wellness","Fast Delivery Across Lagos & Nigeria"]'::jsonb, 'Use as directed for daily care and personal routine. Store in a cool, clean, and dry place.', 'Premium skin-safe and hygienic materials.', false, false, true, 'active', 'Foot Cream | TheBloomingHer Nigeria', 'Buy Foot Cream in Lagos, Nigeria. Fast delivery, verified quality, and easy checkout.', '{"comfort & relaxation","wellness","nigeria","self-care"}'::text[], 5, 6, '["https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496129/a4ynkfu1xjzst89ztbnp.png"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    category_id = EXCLUDED.category_id,
    category_name = EXCLUDED.category_name,
    images = EXCLUDED.images;

-- 8.3 PRODUCT IMAGES (Relational)
INSERT INTO public.product_images (id, product_id, url, alt_text, display_order, is_primary)
VALUES
    ('img-33818-0', 'prod-33818', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg', 'Uzana Pocket Tissue - TheBloomingHer Care & Wellness', 1, true),
    ('img-24207-0', 'prod-24207', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497628/pd6qgwj1y7r81jkkcsi3.png', 'Hand Cream - TheBloomingHer Care & Wellness', 1, true),
    ('img-24168-0', 'prod-24168', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777922535/wcdwg9lj9vukg7v618xt.jpg', 'Under eye Mask - TheBloomingHer Care & Wellness', 1, true),
    ('img-25025-0', 'prod-25025', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778598055/uanszbraoqcjcfsnqakp.jpg', 'Mini Storage Basket - TheBloomingHer Care & Wellness', 1, true),
    ('img-33817-0', 'prod-33817', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430783/jsdi2fa0bmejsr98gq3x.jpg', 'Pure Love Pant Liner - TheBloomingHer Care & Wellness', 1, true),
    ('img-33812-0', 'prod-33812', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789396491/qst76cbeomcu4liwkcp4.jpg', 'Rechargeable Kiki Clipper - TheBloomingHer Care & Wellness', 1, true),
    ('img-24227-0', 'prod-24227', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777986252/gbw3rkqyoaq8wunom5hz.jpg', 'Probiotics Gummies - TheBloomingHer Care & Wellness', 1, true),
    ('img-33776-0', 'prod-33776', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325669/o0rl01b8oanaklazaiha.jpg', 'Shoe Wipes - TheBloomingHer Care & Wellness', 1, true),
    ('img-33776-1', 'prod-33776', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325672/xbffbgb5r92m2tmfe1kl.jpg', 'Shoe Wipes - TheBloomingHer Care & Wellness', 2, false),
    ('img-33772-0', 'prod-33772', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325074/c0oa1vq0thpjvqhm6fsh.jpg', 'Electric Fan - TheBloomingHer Care & Wellness', 1, true),
    ('img-33777-0', 'prod-33777', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325900/wolchtgo2ob16misserm.jpg', 'White Towel - TheBloomingHer Care & Wellness', 1, true),
    ('img-33777-1', 'prod-33777', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325904/lb1d9zcxxdpsfpq52buq.jpg', 'White Towel - TheBloomingHer Care & Wellness', 2, false),
    ('img-33777-2', 'prod-33777', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325909/ngi8clslbmvgm1wo6gus.jpg', 'White Towel - TheBloomingHer Care & Wellness', 3, false),
    ('img-33768-0', 'prod-33768', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789324803/uyqbuvqgeqtwhfl1it49.jpg', 'Pocket Perfume - TheBloomingHer Care & Wellness', 1, true),
    ('img-22359-0', 'prod-22359', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1776956999/bdnfrvva2grsoy6zjswz.jpg', 'Vitamin C - TheBloomingHer Care & Wellness', 1, true),
    ('img-33854-0', 'prod-33854', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497304/hdxognccprylxi5dg60o.png', 'Tongue Scrapper - TheBloomingHer Care & Wellness', 1, true),
    ('img-22358-0', 'prod-22358', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789338151/kb1mlsxmyh35qiewtrro.jpg', 'Menstrual Heating Belt - TheBloomingHer Care & Wellness', 1, true),
    ('img-26789-0', 'prod-26789', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1780333900/qmknqfohdnxd2sbm7dte.jpg', 'Can Wet Wipes - TheBloomingHer Care & Wellness', 1, true),
    ('img-26789-1', 'prod-26789', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1780333897/ycgrufjcfmaeyumyev4a.jpg', 'Can Wet Wipes - TheBloomingHer Care & Wellness', 2, false),
    ('img-24730-0', 'prod-24730', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778404649/rcy2hfmeanadciu5ecws.jpg', 'Probiotics Cranberry Gummies - TheBloomingHer Care & Wellness', 1, true),
    ('img-24500-0', 'prod-24500', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778161593/xkpux3tu1vhvya7592nt.jpg', 'Soft Care Sanitary Pad - TheBloomingHer Care & Wellness', 1, true),
    ('img-24500-1', 'prod-24500', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778161595/izqu3r9s4g3msllf7unz.jpg', 'Soft Care Sanitary Pad - TheBloomingHer Care & Wellness', 2, false),
    ('img-33821-0', 'prod-33821', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789431214/wqil2xikhrm6x2zt7lr5.jpg', 'Tampons - TheBloomingHer Care & Wellness', 1, true),
    ('img-24456-0', 'prod-24456', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789330041/csnn5mryxreqieybqs4x.jpg', 'Comfort Package - TheBloomingHer Care & Wellness', 1, true),
    ('img-24456-1', 'prod-24456', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789330046/lqsiic9bpvksbllt67ke.jpg', 'Comfort Package - TheBloomingHer Care & Wellness', 2, false),
    ('img-24228-0', 'prod-24228', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777986407/f0yf3e7tvnfzhwtcywny.jpg', 'Neurogesic Cream - TheBloomingHer Care & Wellness', 1, true),
    ('img-25032-0', 'prod-25032', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778598610/j0mvpbho8ves3drtiqav.jpg', 'Jewelry Box - TheBloomingHer Care & Wellness', 1, true),
    ('img-25032-1', 'prod-25032', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1782149548/v56fufpxclu8aqnvmdwz.jpg', 'Jewelry Box - TheBloomingHer Care & Wellness', 2, false),
    ('img-24285-0', 'prod-24285', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778022168/finnr552lfgq1zbft4rt.jpg', 'Soft care Mini Wipes - TheBloomingHer Care & Wellness', 1, true),
    ('img-33820-0', 'prod-33820', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789431153/grrgds6zefoibivpgmqf.jpg', 'Reusable Tissue - TheBloomingHer Care & Wellness', 1, true),
    ('img-33796-0', 'prod-33796', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789383046/zeaouarsbxvbibwrjioj.jpg', 'Blueidea Clipper - TheBloomingHer Care & Wellness', 1, true),
    ('img-33769-0', 'prod-33769', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789324879/btjsehm33lk41pouplvf.jpg', 'Coffee Cup - TheBloomingHer Care & Wellness', 1, true),
    ('img-25018-0', 'prod-25018', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778597430/yimfsxgdi2cu7uetpyaf.jpg', 'Glass Tea Cup - TheBloomingHer Care & Wellness', 1, true),
    ('img-33842-0', 'prod-33842', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497525/byeztq51lhjax8kuuuuc.jpg', 'Collagen Foot Mask - TheBloomingHer Care & Wellness', 1, true),
    ('img-33842-1', 'prod-33842', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496055/a4dg09lvfctn9iaawnrx.png', 'Collagen Foot Mask - TheBloomingHer Care & Wellness', 2, false),
    ('img-33852-0', 'prod-33852', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497117/g5fj963tsmfvi1yf6bdq.png', 'Boob Tape - TheBloomingHer Care & Wellness', 1, true),
    ('img-24941-0', 'prod-24941', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778500586/jrga8gygyqjvypg2x7kx.webp', 'Paloma Tissue - TheBloomingHer Care & Wellness', 1, true),
    ('img-24941-1', 'prod-24941', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778500586/s6xwpv72pqoevuiucbai.webp', 'Paloma Tissue - TheBloomingHer Care & Wellness', 2, false),
    ('img-33857-0', 'prod-33857', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497543/cjfewdj5qpy5jbsh460b.jpg', 'Lip Scrubber - TheBloomingHer Care & Wellness', 1, true),
    ('img-33806-0', 'prod-33806', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392317/mo2xpti2h9b6qvsuv0u8.jpg', 'Hot Water Bottle - TheBloomingHer Care & Wellness', 1, true),
    ('img-33806-1', 'prod-33806', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392321/felkhprbpdyp9sbos8bc.jpg', 'Hot Water Bottle - TheBloomingHer Care & Wellness', 2, false),
    ('img-33806-2', 'prod-33806', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392325/yvgehlr2l8fkhmw78fwu.jpg', 'Hot Water Bottle - TheBloomingHer Care & Wellness', 3, false),
    ('img-33845-0', 'prod-33845', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496301/fro1hmlcouwvxcdtic21.png', 'Teeth Whitening Strip - TheBloomingHer Care & Wellness', 1, true),
    ('img-33855-0', 'prod-33855', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497361/bm0iucgsmcqq9v4h7nti.png', 'Perfume - TheBloomingHer Care & Wellness', 1, true),
    ('img-33858-0', 'prod-33858', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497785/bfveqecuhdemgcgtlsim.jpg', 'Foot Scrubber - TheBloomingHer Care & Wellness', 1, true),
    ('img-33770-0', 'prod-33770', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789324968/vitp1a2dlblybxjixsgs.jpg', 'Toothbrush Case - TheBloomingHer Care & Wellness', 1, true),
    ('img-33813-0', 'prod-33813', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789396654/pjqy5looy2cc9feea7ok.jpg', 'Colored Body Towel - TheBloomingHer Care & Wellness', 1, true),
    ('img-33773-0', 'prod-33773', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325124/mdgu8whuszlqevynmd6f.jpg', 'Gym/Sport Bottle - TheBloomingHer Care & Wellness', 1, true),
    ('img-33846-0', 'prod-33846', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496402/o9qayph9km9ndq9u6nc9.png', 'Pimple Patches - TheBloomingHer Care & Wellness', 1, true),
    ('img-33844-0', 'prod-33844', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496207/dkkohlraypfyyxkgwa8f.png', 'Toner Pads - TheBloomingHer Care & Wellness', 1, true),
    ('img-25024-0', 'prod-25024', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778597967/mjcis39bhx4o1jvp7jsk.jpg', 'Lip Mask - TheBloomingHer Care & Wellness', 1, true),
    ('img-25024-1', 'prod-25024', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778597966/wrzt1phpqhjfcojz1tm0.png', 'Lip Mask - TheBloomingHer Care & Wellness', 2, false),
    ('img-33999-0', 'prod-33999', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789796290/cqmhzl69hevqhlploon6.jpg', 'Botare Pocket Tissue - TheBloomingHer Care & Wellness', 1, true),
    ('img-24457-0', 'prod-24457', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789330003/mawebpvw0q1wuyo0hixl.jpg', 'Premium Period Care Package - TheBloomingHer Care & Wellness', 1, true),
    ('img-24457-1', 'prod-24457', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789329981/m3c8lytz26yben0dbr0z.jpg', 'Premium Period Care Package - TheBloomingHer Care & Wellness', 2, false),
    ('img-33819-0', 'prod-33819', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430919/sq1gl48xjz7unklbeqmv.jpg', 'Disposable Pants - TheBloomingHer Care & Wellness', 1, true),
    ('img-26798-0', 'prod-26798', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1780338538/jizbgpbxciilirdi4xf8.jpg', '3-month Bloomie Package - TheBloomingHer Care & Wellness', 1, true),
    ('img-26798-1', 'prod-26798', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1782149812/zq8lvhpxzzeqeiut3jru.jpg', '3-month Bloomie Package - TheBloomingHer Care & Wellness', 2, false),
    ('img-26798-2', 'prod-26798', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1782149817/a6gbwkwsezvhbtj2whjj.jpg', '3-month Bloomie Package - TheBloomingHer Care & Wellness', 3, false),
    ('img-33860-0', 'prod-33860', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789498019/xy6roqeqj4nimrirq3yi.jpg', 'Herbal Tea - TheBloomingHer Care & Wellness', 1, true),
    ('img-33850-0', 'prod-33850', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496833/jla2k76uzdqhplpafhgi.png', 'Glow In The Dark - TheBloomingHer Care & Wellness', 1, true),
    ('img-33778-0', 'prod-33778', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789325969/phisnp2t3nxtmqlzhnhc.png', 'Gym Towel - TheBloomingHer Care & Wellness', 1, true),
    ('img-24224-0', 'prod-24224', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777981987/h63bciol2cozwyw3zuss.jpg', 'Period Care Package - TheBloomingHer Care & Wellness', 1, true),
    ('img-33856-0', 'prod-33856', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789497462/hxvie8bnp6abptjy2f0l.png', 'Hair Claws - TheBloomingHer Care & Wellness', 1, true),
    ('img-24229-0', 'prod-24229', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777986728/q6kyprwaxuhfklf2vgjk.jpg', 'Pocket Tissue - TheBloomingHer Care & Wellness', 1, true),
    ('img-24502-0', 'prod-24502', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778162377/l23nchhtlzc5uipbru2q.jpg', 'Soft Care Roll - TheBloomingHer Care & Wellness', 1, true),
    ('img-24235-0', 'prod-24235', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777988366/nptxv8nge2ssijrzwzry.jpg', 'Neck Pillow - TheBloomingHer Care & Wellness', 1, true),
    ('img-33849-0', 'prod-33849', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496698/scmztlbn8fbnb2ukn3ov.png', 'Rabbit Phone Holder - TheBloomingHer Care & Wellness', 1, true),
    ('img-33843-0', 'prod-33843', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789496129/a4ynkfu1xjzst89ztbnp.png', 'Foot Cream - TheBloomingHer Care & Wellness', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 8.4 INVENTORY (54 Total)
INSERT INTO public.inventory (id, product_id, stock_quantity, low_stock_threshold, sku)
VALUES
    ('inv_prod-33818', 'prod-33818', 100, 3, 'UZ266828'),
    ('inv_prod-24207', 'prod-24207', 96, 3, 'HA622148'),
    ('inv_prod-24168', 'prod-24168', 98, 3, 'UN072809'),
    ('inv_prod-25025', 'prod-25025', 20, 3, 'MI515919'),
    ('inv_prod-33817', 'prod-33817', 50, 3, 'PU987261'),
    ('inv_prod-33812', 'prod-33812', 10, 3, 'RE011959'),
    ('inv_prod-24227', 'prod-24227', 50, 3, 'PR850386'),
    ('inv_prod-33776', 'prod-33776', 50, 3, 'SH717925'),
    ('inv_prod-33772', 'prod-33772', 7, 3, 'EL291613'),
    ('inv_prod-33777', 'prod-33777', 15, 3, 'WH112278'),
    ('inv_prod-33768', 'prod-33768', 20, 3, 'PO309942'),
    ('inv_prod-22359', 'prod-22359', 46, 3, 'VI938106'),
    ('inv_prod-33854', 'prod-33854', 20, 3, 'TO948430'),
    ('inv_prod-22358', 'prod-22358', 44, 3, 'ME275019'),
    ('inv_prod-26789', 'prod-26789', 100, 3, 'CA170925'),
    ('inv_prod-24730', 'prod-24730', 20, 3, 'PR451052'),
    ('inv_prod-24500', 'prod-24500', 100, 3, 'SO908201'),
    ('inv_prod-33821', 'prod-33821', 50, 3, 'TA061637'),
    ('inv_prod-24456', 'prod-24456', 20, 3, 'CO326533'),
    ('inv_prod-24228', 'prod-24228', 50, 3, 'NE512835'),
    ('inv_prod-25032', 'prod-25032', 10, 3, 'JE472728'),
    ('inv_prod-24285', 'prod-24285', 90, 3, 'SO122778'),
    ('inv_prod-33820', 'prod-33820', 20, 3, 'RE290135'),
    ('inv_prod-33796', 'prod-33796', 10, 3, 'BL056223'),
    ('inv_prod-33769', 'prod-33769', 10, 3, 'CO859172'),
    ('inv_prod-25018', 'prod-25018', 20, 3, 'GL850370'),
    ('inv_prod-33842', 'prod-33842', 20, 3, 'CO835544'),
    ('inv_prod-33852', 'prod-33852', 10, 3, 'BO954068'),
    ('inv_prod-24941', 'prod-24941', 100, 3, 'PA980594'),
    ('inv_prod-33857', 'prod-33857', 10, 3, 'LI689967'),
    ('inv_prod-33806', 'prod-33806', 10, 3, 'HO883177'),
    ('inv_prod-33845', 'prod-33845', 10, 3, 'TE570256'),
    ('inv_prod-33855', 'prod-33855', 20, 3, 'PE605099'),
    ('inv_prod-33858', 'prod-33858', 10, 3, 'FO477511'),
    ('inv_prod-33770', 'prod-33770', 20, 3, 'TO928617'),
    ('inv_prod-33813', 'prod-33813', 20, 3, 'CO139615'),
    ('inv_prod-33773', 'prod-33773', 10, 3, 'GY102130'),
    ('inv_prod-33846', 'prod-33846', 15, 3, 'PI610751'),
    ('inv_prod-33844', 'prod-33844', 10, 3, 'TO223649'),
    ('inv_prod-25024', 'prod-25024', 100, 3, 'LI975540'),
    ('inv_prod-33999', 'prod-33999', 100, 3, 'BO048023'),
    ('inv_prod-24457', 'prod-24457', 20, 3, 'PR116580'),
    ('inv_prod-33819', 'prod-33819', 50, 3, 'DI149078'),
    ('inv_prod-26798', 'prod-26798', 9, 3, 'MO251074'),
    ('inv_prod-33860', 'prod-33860', 20, 3, 'HE834327'),
    ('inv_prod-33850', 'prod-33850', 5, 3, 'GL688919'),
    ('inv_prod-33778', 'prod-33778', 10, 3, 'GY138628'),
    ('inv_prod-24224', 'prod-24224', 20, 3, 'PE406671'),
    ('inv_prod-33856', 'prod-33856', 20, 3, 'HA133832'),
    ('inv_prod-24229', 'prod-24229', 50, 3, 'PO749170'),
    ('inv_prod-24502', 'prod-24502', 100, 3, 'SO791836'),
    ('inv_prod-24235', 'prod-24235', 50, 3, 'NE903045'),
    ('inv_prod-33849', 'prod-33849', 10, 3, 'RA510819'),
    ('inv_prod-33843', 'prod-33843', 20, 3, 'FO548219')
ON CONFLICT (product_id) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity,
    low_stock_threshold = EXCLUDED.low_stock_threshold;

-- 8.5 RBAC ROLES
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
    ('event_wellness_day_2026', 'BloomingHer Wellness Day 2026', 'bloomingher-wellness-day-2026', 'wellness_day', 'Join hundreds of women for doctor-led pelvic health sessions, menstrual masterclasses, sound bath therapy, and curated self-care kits.', 'A full-day immersive sanctuary dedicated to women''s health, cycle comfort, and bodily rest in Ikeja, Lagos.', '2026-10-18', '10:00 AM', '4:00 PM', 'Radisson Blu Anchorage, Victoria Island, Lagos', false, 'https://thebloomingher.vercel.app/events/bloomingher-wellness-day-2026', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'active', true),
    ('event_cycle_care_masterclass', 'Menstrual Health & Hormone Masterclass', 'cycle-care-masterclass', 'workshop', 'A virtual interactive session led by gynecologists on understanding your luteal phase, managing endometriosis symptoms, and cycle nutrition.', 'Learn practical tools and habits to align your diet, work, and exercise with your hormonal rhythm.', '2026-11-05', '6:00 PM', '8:00 PM', 'Online Zoom Event', true, 'https://thebloomingher.vercel.app/events/cycle-care-masterclass', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'active', true)
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
