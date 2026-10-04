-- Migration 013: FAQs Schema
-- Database table for managing dynamic storefront & SEO FAQs

CREATE TABLE IF NOT EXISTS public.faqs (
  id VARCHAR(255) PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'general', -- 'delivery' | 'products' | 'orders' | 'returns' | 'general'
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast status & sorting queries
CREATE INDEX IF NOT EXISTS idx_faqs_status_sort ON public.faqs (is_active, is_published, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category);

-- Enable Row Level Security
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read active published faqs" ON public.faqs;
CREATE POLICY "Public read active published faqs" ON public.faqs
  FOR SELECT USING (is_active = true AND is_published = true);

DROP POLICY IF EXISTS "Admin full access faqs" ON public.faqs;
CREATE POLICY "Admin full access faqs" ON public.faqs
  FOR ALL USING (true);
