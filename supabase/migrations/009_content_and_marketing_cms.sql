-- Migration 009: Content & Marketing CMS Schema
-- Tables for Banners, Campaigns, Events, Announcements, Media Assets & Display Placements

-- 1. Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
  banner_ids JSONB DEFAULT '[]',
  promotion_ids JSONB DEFAULT '[]',
  coupon_ids JSONB DEFAULT '[]',
  announcement_ids JSONB DEFAULT '[]',
  featured_product_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Marketing Events Table
CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  tagline VARCHAR(255),
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  event_date DATE NOT NULL,
  start_time VARCHAR(32) NOT NULL,
  end_time VARCHAR(32),
  location TEXT NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  registration_url TEXT NOT NULL,
  cta_text VARCHAR(64) NOT NULL DEFAULT 'Register Now',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(32) NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'draft'
  max_attendees INT,
  registered_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Marketing Banners Table
CREATE TABLE IF NOT EXISTS marketing_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  highlighted_title VARCHAR(255),
  subtitle TEXT,
  badge_text VARCHAR(128),
  banner_type VARCHAR(64) NOT NULL DEFAULT 'promotion', -- 'promotion' | 'product' | 'event' | 'announcement' | 'new_arrival' | 'seasonal_campaign' | 'custom'
  placement VARCHAR(64) NOT NULL DEFAULT 'homepage_hero', -- 'homepage_hero' | 'homepage_split_banners' | 'homepage_promo_strip' | 'product_listing_banner' | 'category_page_banner' | 'event_section' | 'announcement_bar' | 'footer_promo'
  
  -- Smart CTA fields
  primary_cta JSONB NOT NULL DEFAULT '{"text":"Shop Now","destinationType":"custom_page","url":"/shop"}',
  secondary_cta JSONB DEFAULT NULL,

  -- Responsive Media
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  tablet_image_url TEXT,
  alt_text VARCHAR(255) NOT NULL DEFAULT 'Promotional Banner',
  theme_color VARCHAR(64) DEFAULT 'plum',

  -- Associated Foreign Keys
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  event_id UUID REFERENCES marketing_events(id) ON DELETE SET NULL,

  -- Ordering & Priority
  priority_order INT NOT NULL DEFAULT 0,

  -- Scheduling & Status
  status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',

  -- Performance metrics
  clicks_count INT NOT NULL DEFAULT 0,
  impressions_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Marketing Announcements Table
CREATE TABLE IF NOT EXISTS marketing_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  link_url TEXT,
  link_text VARCHAR(64),
  placement VARCHAR(64) NOT NULL DEFAULT 'top_bar', -- 'top_bar' | 'homepage_section' | 'inline_banner' | 'modal_popup'
  bg_color VARCHAR(64) DEFAULT '#FAF5F7',
  text_color VARCHAR(64) DEFAULT '#B85D88',
  is_closable BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Media Assets Table (Centralized Media Library)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(128) NOT NULL DEFAULT 'image/jpeg',
  width INT,
  height INT,
  alt_text VARCHAR(255),
  tags JSONB DEFAULT '[]',
  folder VARCHAR(128) DEFAULT 'general',
  uploaded_by VARCHAR(255),
  used_in JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_banners_placement_status ON marketing_banners (placement, status);
CREATE INDEX IF NOT EXISTS idx_banners_schedule ON marketing_banners (status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_priority ON marketing_banners (priority_order ASC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_events_date ON marketing_events (event_date, status);
CREATE INDEX IF NOT EXISTS idx_announcements_placement ON marketing_announcements (placement, status);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_assets (created_at DESC);

-- 7. Row Level Security Policies
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Public read for active items
CREATE POLICY "Public read active campaigns" ON marketing_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Public read upcoming events" ON marketing_events FOR SELECT USING (status IN ('upcoming', 'ongoing'));
CREATE POLICY "Public read active banners" ON marketing_banners FOR SELECT USING (status = 'active');
CREATE POLICY "Public read active announcements" ON marketing_announcements FOR SELECT USING (status = 'active');
CREATE POLICY "Public read media assets" ON media_assets FOR SELECT USING (true);
