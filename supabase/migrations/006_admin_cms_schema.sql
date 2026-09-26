-- Migration 006: Admin CMS, Discounts, Promotions, Audit Trail & Site Settings

-- 1. Discounts & Coupons Table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed_amount'
  value NUMERIC(12, 2) NOT NULL,
  min_spend NUMERIC(12, 2) DEFAULT 0,
  max_discount NUMERIC(12, 2),
  usage_limit INT DEFAULT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_order_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed WELCOME10 coupon
INSERT INTO discounts (code, type, value, min_spend, is_active)
VALUES ('WELCOME10', 'percentage', 10, 0, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Promotions & Campaigns Table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  banner_image TEXT,
  description TEXT,
  cta_text VARCHAR(64) DEFAULT 'Shop Now',
  cta_link VARCHAR(255) DEFAULT '/shop',
  discount_percentage NUMERIC(5, 2),
  placement VARCHAR(32) NOT NULL DEFAULT 'homepage',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Audit Logs Table (Admin Activity Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(128) NOT NULL,
  resource VARCHAR(64) NOT NULL,
  resource_id VARCHAR(128),
  details JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Site Settings Key-Value / Singleton Table
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'primary',
  business_name VARCHAR(255) NOT NULL DEFAULT 'TheBloomingHer Care & Wellness',
  tagline VARCHAR(255) NOT NULL DEFAULT 'Thoughtful Care for Women in Nigeria',
  logo_url TEXT NOT NULL DEFAULT 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1776879112/gvtrxd5k08aux5iem6gu.jpg',
  address TEXT NOT NULL DEFAULT '30 Clem Road, Ifako-Ijaiye, Lagos, Nigeria',
  phone VARCHAR(64) NOT NULL DEFAULT '+2348103641002',
  whatsapp_number VARCHAR(64) NOT NULL DEFAULT '+2348103641002',
  support_email VARCHAR(255) NOT NULL DEFAULT 'support@thebloomingher.com',
  opening_hours VARCHAR(128) NOT NULL DEFAULT 'Mon – Sat: 9:00 AM – 6:00 PM',
  free_shipping_threshold NUMERIC(12, 2) NOT NULL DEFAULT 40000,
  lagos_delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 2500,
  nationwide_delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 4500,
  site_title TEXT NOT NULL DEFAULT 'TheBloomingHer Care & Wellness | Period Kits & Self-Care Nigeria',
  site_description TEXT NOT NULL DEFAULT 'Premium feminine care, menstrual heating belts, and everyday wellness essentials in Lagos, Nigeria.',
  default_og_image TEXT NOT NULL DEFAULT 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (id) VALUES ('primary') ON CONFLICT (id) DO NOTHING;

-- 5. Analytics & Recommendation Signals Table
CREATE TABLE IF NOT EXISTS analytics_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(64) NOT NULL,
  product_id VARCHAR(64),
  category_name VARCHAR(128),
  search_term TEXT,
  session_id VARCHAR(128),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts (code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts (is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_signals_event ON analytics_signals (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_signals_product ON analytics_signals (product_id);

-- 7. Row Level Security
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active discounts" ON discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active promotions" ON promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public insert analytics signals" ON analytics_signals FOR INSERT WITH CHECK (true);
