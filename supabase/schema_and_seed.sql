-- ==============================================================================
-- TheBloomingHer Care & Wellness — Complete Consolidated Schema & Seed
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- Enable UUID extension
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
-- 2. CORE CATALOG TABLES
-- ==============================================================================

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id INT UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(12, 2) NOT NULL,
    compare_at_price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'NGN' NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INT DEFAULT 0 NOT NULL,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    stock_quantity INT DEFAULT 0 NOT NULL,
    low_stock_threshold INT DEFAULT 5 NOT NULL,
    allow_backorder BOOLEAN DEFAULT false NOT NULL,
    sku VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
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

-- Customers table for storefront authentication & orders
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 4. ORDERS & PAYMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    status order_status DEFAULT 'pending' NOT NULL,
    payment_status payment_status DEFAULT 'unpaid' NOT NULL,
    payment_reference VARCHAR(100),
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN' NOT NULL,
    shipping_address JSONB NOT NULL,
    order_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_image_url TEXT,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 5. RBAC & ADMINISTRATORS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY DEFAULT 'admin_' || gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id TEXT REFERENCES public.roles(id) ON DELETE RESTRICT,
    role_name TEXT,
    role_slug TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY DEFAULT 'log_' || gen_random_uuid(),
    admin_id TEXT REFERENCES public.admin_users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Storefront
DO $$ BEGIN
    CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);
    CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
    CREATE POLICY "Allow public read on product_images" ON public.product_images FOR SELECT USING (true);
    CREATE POLICY "Allow public read on inventory" ON public.inventory FOR SELECT USING (true);
    CREATE POLICY "Allow public read on banners" ON public.marketing_banners FOR SELECT USING (status = 'active');
    CREATE POLICY "Allow public read on events" ON public.marketing_events FOR SELECT USING (status = 'active');
    CREATE POLICY "Allow public read on announcements" ON public.marketing_announcements FOR SELECT USING (status = 'active');
    CREATE POLICY "Allow public read on coupons" ON public.marketing_coupons FOR SELECT USING (status = 'active');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Service role full access
DO $$ BEGIN
    CREATE POLICY "Allow all on profiles for service role" ON public.profiles FOR ALL USING (true);
    CREATE POLICY "Allow all on customers for service role" ON public.customers FOR ALL USING (true);
    CREATE POLICY "Allow all on orders for service role" ON public.orders FOR ALL USING (true);
    CREATE POLICY "Allow all on order_items for service role" ON public.order_items FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 8. SEED DATA
-- ==============================================================================

-- 8.1 CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Feminine Care', 'feminine-care', 'Doctor-approved organic pads, menstrual care essentials, and gentle intimate washes.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg', 1, true),
    ('c2222222-2222-2222-2222-222222222222', 'Everyday Essentials', 'everyday-essentials', 'Everyday hygiene, soothing wipes, herbal teas, and daily wellness items.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 2, true),
    ('c3333333-3333-3333-3333-333333333333', 'Wellness & Body Care', 'wellness-body-care', 'Natural botanical body care, soothing bath salts, and hormone balance supplements.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg', 3, true),
    ('c4444444-4444-4444-4444-444444444444', 'Comfort & Relaxation', 'comfort-relaxation', 'Intelligent thermal heating belts, acupressure relief, and soothing comfort essentials.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg', 4, true),
    ('c5555555-5555-5555-5555-555555555555', 'Beauty & Self-Care', 'beauty-self-care', 'Glow oils, silk eye masks, and aromatherapy self-care rituals.', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg', 5, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

-- 8.2 PRODUCTS
INSERT INTO public.products (id, name, slug, sku, price, compare_at_price, category_id, category_name, short_description, description, is_featured, is_bestseller, is_new_arrival, status, rating, rating_count)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'Smart Menstrual Heating & Vibration Belt', 'smart-menstrual-heating-vibration-belt', 'BH-HEAT-001', 18500.00, 24000.00, 'c4444444-4444-4444-4444-444444444444', 'Comfort & Relaxation', 'Cordless rechargeable thermal heating belt with 3 warmth levels and 4 vibration massage modes.', 'Experience immediate soothing relief from menstrual cramps and back tension with our wireless ergonomic heating belt.', true, true, false, 'active', 4.95, 38),
    ('p2222222-2222-2222-2222-222222222222', 'Bloomie Care Deluxe Period Package', 'bloomie-care-deluxe-period-package', 'BH-KIT-001', 28500.00, 35000.00, 'c1111111-1111-1111-1111-111111111111', 'Feminine Care', 'Complete cycle comfort kit with organic pads, pain relief patches, herbal cramp tea, and satin pouch.', 'Our best-selling cycle care box curated with every essential needed for a stress-free, deeply comfortable period.', true, true, true, 'active', 5.00, 64),
    ('p3333333-3333-3333-3333-333333333333', 'Gentle pH-Balancing Botanical Foam Wash', 'gentle-ph-balancing-botanical-foam-wash', 'BH-WASH-001', 7500.00, 9500.00, 'c1111111-1111-1111-1111-111111111111', 'Feminine Care', 'Ultra-mild, hypoallergenic foaming wash formulated with chamomile, aloe vera, and lactic acid.', 'Maintains delicate intimate pH balance with 100% plant-based, paraben-free natural botanical extracts.', false, true, false, 'active', 4.88, 29),
    ('p4444444-4444-4444-4444-444444444444', 'Herbal Cramp Relief & Womb Wellness Tea', 'herbal-cramp-relief-womb-wellness-tea', 'BH-TEA-001', 5800.00, 7000.00, 'c3333333-3333-3333-3333-333333333333', 'Wellness & Body Care', 'Organic blend of red raspberry leaf, ginger root, and chamomile for uterine muscle relaxation.', 'Traditional herbal formulation designed to reduce bloating, ease pelvic spasms, and restore calm.', false, false, true, 'active', 4.90, 19),
    ('p5555555-5555-5555-5555-555555555555', 'Organic Cotton Biodegradable Night Pads (Pack of 10)', 'organic-cotton-biodegradable-night-pads', 'BH-PAD-001', 4200.00, 5000.00, 'c1111111-1111-1111-1111-111111111111', 'Feminine Care', '100% GOTS certified organic cotton surface with leak-proof wings and maximum night absorption.', 'Ultra-soft, chlorine-free, and breathable protection that prevents irritation and rashes.', false, true, false, 'active', 4.92, 45)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    short_description = EXCLUDED.short_description;

-- 8.3 PRODUCT IMAGES
INSERT INTO public.product_images (product_id, url, alt_text, display_order, is_primary)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg', 'Smart Menstrual Heating Belt', 1, true),
    ('p2222222-2222-2222-2222-222222222222', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'Bloomie Care Deluxe Period Package', 1, true),
    ('p3333333-3333-3333-3333-333333333333', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg', 'Gentle pH-Balancing Botanical Foam Wash', 1, true),
    ('p4444444-4444-4444-4444-444444444444', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg', 'Herbal Cramp Relief Tea', 1, true),
    ('p5555555-5555-5555-5555-555555555555', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'Organic Cotton Pads', 1, true)
ON CONFLICT DO NOTHING;

-- 8.4 INVENTORY
INSERT INTO public.inventory (product_id, stock_quantity, low_stock_threshold, sku)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 25, 5, 'BH-HEAT-001'),
    ('p2222222-2222-2222-2222-222222222222', 18, 5, 'BH-KIT-001'),
    ('p3333333-3333-3333-3333-333333333333', 40, 8, 'BH-WASH-001'),
    ('p4444444-4444-4444-4444-444444444444', 30, 6, 'BH-TEA-001'),
    ('p5555555-5555-5555-5555-555555555555', 50, 10, 'BH-PAD-001')
ON CONFLICT (product_id) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity;

-- 8.5 RBAC ROLES & PERMISSIONS
INSERT INTO public.roles (id, name, slug, description, permissions, is_system)
VALUES
    ('role_super_admin', 'Super Administrator', 'super_admin', 'Unrestricted administrative access across all system operations, settings, and team management.', '["*"]'::jsonb, true),
    ('role_marketing_admin', 'Marketing Administrator', 'marketing_admin', 'Manages banners, campaigns, promotions, community events, announcements, and discounts.', '["cms:view","cms:edit","marketing:view","marketing:manage","events:manage","coupons:manage"]'::jsonb, true),
    ('role_catalog_manager', 'Catalog & Product Manager', 'catalog_manager', 'Manages products, categories, pricing, inventory stock, and collections.', '["products:view","products:create","products:edit","products:delete","inventory:view","inventory:manage","categories:manage"]'::jsonb, true),
    ('role_order_fulfillment', 'Order Fulfillment Manager', 'order_fulfillment', 'Processes orders, updates shipment statuses, and manages customer pickups.', '["orders:view","orders:edit","orders:fulfill","customers:view"]'::jsonb, true),
    ('role_customer_support', 'Customer Support Agent', 'customer_support', 'Handles customer queries, reviews, order status lookups, and support tickets.', '["orders:view","customers:view","reviews:manage"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    permissions = EXCLUDED.permissions;

-- 8.6 INITIAL SUPER ADMIN ACCOUNT (Password: AdminPass123!)
INSERT INTO public.admin_users (id, email, password_hash, first_name, last_name, full_name, role_id, role_name, role_slug, status, is_active, must_change_password)
VALUES
    ('admin_root_1', 'admin@thebloomingher.com', '$2a$10$tZ1KkP1qVzY5QJ6M6VbYTeuV0lWv1oM4Z5o9j6nK5Fh3d6b9qZ5y6', 'BloomingHer', 'SuperAdmin', 'BloomingHer SuperAdmin', 'role_super_admin', 'Super Administrator', 'super_admin', 'active', true, false)
ON CONFLICT (email) DO NOTHING;

-- 8.7 CMS HERO BANNERS
INSERT INTO public.marketing_banners (id, title, highlighted_title, subtitle, badge_text, banner_type, placement, primary_cta, secondary_cta, desktop_image_url, mobile_image_url, alt_text, priority_order, status, internal_name)
VALUES
    ('banner-hero-1', 'Soothe Severe Period Cramp Pain in', 'Under 10 Minutes.', 'Doctor-tested rechargeable menstrual heating belt with soothing vibration and targeted thermal warmth. Same-day Lagos dispatch!', 'BEST SELLER • FAST ACTING DRUG-FREE COMFORT', 'promotion', 'homepage_hero', '{"text":"Order Cramp Relief Belt","url":"/products/electric-heating-pad-vibration-cramp-relief-belt"}'::jsonb, '{"text":"Explore Pain Relief","url":"/categories/pain-relief-comfort"}'::jsonb, 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789398339/jybtyu4rrytv7mgoksvl.jpg', 'Electric Menstrual Cramp Relief Heating Belt', 1, 'active', 'Hero 1 - Menstrual Cramp Relief Belt Advert'),
    ('banner-hero-2', 'Upgrade Your Monthly Cycle Care with', '10% Off Your Entire Order.', 'Stock up on premium organic cotton pads, medical-grade menstrual cups, womb wellness teas, and hygiene essentials. Free Lagos doorstep delivery over ₦40,000.', 'LIMITED TIME PROMO • USE CODE BLOOM10', 'promotion', 'homepage_hero', '{"text":"Claim 10% Discount","url":"/products"}'::jsonb, '{"text":"View Under ₦10k Finds","url":"/collections/under-10k-finds"}'::jsonb, 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'TheBloomingHer Care & Wellness Products Special Offer', 2, 'active', 'Hero 2 - Welcome 10% Discount Promotion'),
    ('banner-hero-3', 'Complete Intimate Hygiene & Herbal Comfort,', 'Delivered Discreetly.', 'pH-balanced intimate washes, herbal womb wellness tea blends, and breathable liners crafted to keep you feeling fresh, confident, and balanced all month long.', 'ALL-IN-ONE CARE • CURATED SELF-CARE KITS', 'promotion', 'homepage_hero', '{"text":"Shop Care Bundles","url":"/collections/bloomie-care"}'::jsonb, '{"text":"Browse Intimate Hygiene","url":"/categories/intimate-hygiene"}'::jsonb, 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg', 'Bloomie Care Complete Intimate Hygiene Bundles', 3, 'active', 'Hero 3 - Bloomie Care Complete Kits Advert'),
    ('banner-hero-4', 'Confidence, Dignity & Peace of Mind for', 'Every Blooming Woman.', 'Over 10,000+ satisfied women across Lagos, Abuja, Port Harcourt and nationwide. 100% discrete plain packaging, same-day dispatch & friendly WhatsApp concierge.', 'NIGERIA''S #1 TRUSTED FEMININE CARE', 'promotion', 'homepage_hero', '{"text":"Explore All Essentials","url":"/products"}'::jsonb, '{"text":"Chat on WhatsApp","url":"https://wa.me/2348149725817"}'::jsonb, 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg', 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg', 'TheBloomingHer Nationwide Delivery & Trust', 4, 'active', 'Hero 4 - Nigeria Trusted Nationwide Delivery')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    highlighted_title = EXCLUDED.highlighted_title,
    subtitle = EXCLUDED.subtitle,
    badge_text = EXCLUDED.badge_text,
    primary_cta = EXCLUDED.primary_cta,
    secondary_cta = EXCLUDED.secondary_cta,
    desktop_image_url = EXCLUDED.desktop_image_url,
    mobile_image_url = EXCLUDED.mobile_image_url,
    alt_text = EXCLUDED.alt_text,
    priority_order = EXCLUDED.priority_order,
    status = EXCLUDED.status,
    internal_name = EXCLUDED.internal_name;

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
    ('ann_free_shipping', 'FREE Lagos Doorstep Delivery on orders over ₦40,000 | Same-Day Lagos Dispatch Available', 'FREE Lagos Delivery', 'Shop Now', '/shop', 'brand', 'active')
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text;

-- 8.10 COUPONS
INSERT INTO public.marketing_coupons (id, code, title, description, discount_type, discount_value, minimum_spend, status)
VALUES
    ('coup_welcome10', 'BLOOM10', 'Welcome 10% Off', '10% off your first order over ₦15,000', 'percentage', 10.00, 15000.00, 'active'),
    ('coup_comfort5k', 'COMFORT5K', '₦5,000 Off Heating Belt Bundles', '₦5,000 off orders containing menstrual heating belts above ₦30,000', 'fixed_amount', 5000.00, 30000.00, 'active')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title;
