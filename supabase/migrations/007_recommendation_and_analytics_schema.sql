-- ============================================================================
-- TheBloomingHer Care & Wellness - Migration 007
-- Recommendation Engine & Customer Behavior Analytics Schema
-- ============================================================================

-- 1. PRODUCT RELATIONSHIPS (Manual & Rule Overrides)
CREATE TABLE IF NOT EXISTS public.product_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_product_id TEXT NOT NULL,
    target_product_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('related', 'frequently_bought_together', 'complementary', 'alternative')),
    priority_weight INTEGER NOT NULL DEFAULT 50 CHECK (priority_weight BETWEEN 1 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_manual BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_relationship UNIQUE (source_product_id, target_product_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_product_rel_source ON public.product_relationships(source_product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_rel_type ON public.product_relationships(relationship_type, priority_weight DESC);

-- 2. PRODUCT CO-PURCHASE AGGREGATIONS (Calculated from Orders)
CREATE TABLE IF NOT EXISTS public.product_co_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_product_id TEXT NOT NULL,
    target_product_id TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 1,
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 0.0000, -- 0.0 to 1.0
    last_occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_co_purchase_pair UNIQUE (source_product_id, target_product_id)
);

CREATE INDEX IF NOT EXISTS idx_co_purchase_source ON public.product_co_purchases(source_product_id, frequency DESC);
CREATE INDEX IF NOT EXISTS idx_co_purchase_confidence ON public.product_co_purchases(confidence_score DESC);

-- 3. CUSTOMER BEHAVIOR ANALYTICS EVENTS (Privacy-Preserving)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'product_view',
            'product_search',
            'category_view',
            'add_to_cart',
            'remove_from_cart',
            'checkout_started',
            'purchase',
            'wishlist_add',
            'wishlist_remove',
            'recommendation_impression',
            'recommendation_click',
            'recommendation_add_to_cart'
        )
    ),
    user_id TEXT,
    anonymous_session_id TEXT NOT NULL,
    product_id TEXT,
    category_id TEXT,
    search_query TEXT,
    order_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast retrieval of recent sessions and conversion signals
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(anonymous_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type_time ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_product_events ON public.analytics_events(product_id, event_type);

-- 4. USER BROWSING PROFILES (Aggregated category/tag affinity for personalization)
CREATE TABLE IF NOT EXISTS public.user_browsing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    category_affinities JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"cat-pain-relief": 12, "cat-intimate-hygiene": 5}
    tag_affinities JSONB NOT NULL DEFAULT '{}'::jsonb,      -- e.g. {"heating": 8, "cramp": 10, "organic": 4}
    recent_viewed_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profile_session ON public.user_browsing_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_user ON public.user_browsing_profiles(user_id) WHERE user_id IS NOT NULL;

-- 5. RLS POLICIES
ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_co_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_browsing_profiles ENABLE ROW LEVEL SECURITY;

-- Public read for active product relationships
CREATE POLICY "Public read active product relationships"
    ON public.product_relationships FOR SELECT
    USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access on product relationships"
    ON public.product_relationships FOR ALL
    USING (auth.role() = 'service_role');

-- Service role full access on co-purchases
CREATE POLICY "Service role access on co-purchases"
    ON public.product_co_purchases FOR ALL
    USING (auth.role() = 'service_role');

-- Public insert for analytics events (anonymous shoppers reporting interactions)
CREATE POLICY "Allow public insert for analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

-- Service role read for analytics events
CREATE POLICY "Service role read analytics events"
    ON public.analytics_events FOR SELECT
    USING (auth.role() = 'service_role');
