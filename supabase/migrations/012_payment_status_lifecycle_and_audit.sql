-- ============================================================================
-- TheBloomingHer Care & Wellness - Migration 012
-- Payment Status Lifecycle, Audit Metadata & Abandonment Processing
-- ============================================================================

-- 1. Ensure columns exist on orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32) DEFAULT 'flutterwave',
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(128),
  ADD COLUMN IF NOT EXISTS flutterwave_reference VARCHAR(128),
  ADD COLUMN IF NOT EXISTS flutterwave_transaction_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS flutterwave_authorization_url TEXT,
  ADD COLUMN IF NOT EXISTS paystack_reference VARCHAR(128),
  ADD COLUMN IF NOT EXISTS paystack_access_code VARCHAR(128),
  ADD COLUMN IF NOT EXISTS paystack_authorization_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(32),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- 2. Create Payments Table (Compatible with TEXT order IDs)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference VARCHAR(128) UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  gateway VARCHAR(32) NOT NULL DEFAULT 'flutterwave',
  gateway_reference VARCHAR(128),
  gateway_response TEXT,
  channel VARCHAR(32),
  paid_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount NUMERIC(12, 2),
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns on payments if table existed before
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gateway_reference VARCHAR(128),
  ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. High-Performance Indexes for Payment Queries & Fast Abandonment Sweeps
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created ON public.orders (payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments (status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments (reference);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);

-- 4. Atomic Inventory Reduction Function (Accepts TEXT/UUID order_id)
CREATE OR REPLACE FUNCTION reduce_order_inventory(p_order_id TEXT)
RETURNS VOID AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN 
    SELECT product_id, variant_id, quantity 
    FROM order_items 
    WHERE order_id::text = p_order_id::text
  LOOP
    -- If variant, reduce variant stock
    IF item.variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
      WHERE id::text = item.variant_id::text;
    END IF;

    -- Reduce main product stock
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
    WHERE id::text = item.product_id::text;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Safe PostgreSQL RPC Function for 30-Minute Abandonment Sweeps
-- Automatically transitions pending orders older than p_minutes (default 30) to 'abandoned'
CREATE OR REPLACE FUNCTION public.process_abandoned_orders(p_interval_minutes INT DEFAULT 30)
RETURNS TABLE(abandoned_count INT) AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- Mark orders abandoned
  WITH eligible_orders AS (
    UPDATE public.orders
    SET 
      payment_status = 'abandoned',
      status = 'abandoned',
      order_status = 'abandoned',
      abandoned_at = NOW(),
      updated_at = NOW()
    WHERE payment_status IN ('pending', 'payment_pending', 'unpaid')
      AND created_at < NOW() - (p_interval_minutes || ' minutes')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO v_count FROM eligible_orders;

  -- Sync corresponding payment records
  IF v_count > 0 THEN
    UPDATE public.payments
    SET 
      status = 'abandoned',
      abandoned_at = NOW(),
      updated_at = NOW()
    WHERE status IN ('pending', 'payment_pending', 'unpaid')
      AND created_at < NOW() - (p_interval_minutes || ' minutes')::INTERVAL;
  END IF;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
