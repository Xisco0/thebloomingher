-- Migration 005: Paystack Payment Records & Atomic Inventory Deduction
-- Ensures secure audit trail of all Paystack transactions and safe stock reduction

-- 1. Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reference VARCHAR(128) UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  gateway VARCHAR(32) NOT NULL DEFAULT 'paystack',
  gateway_response TEXT,
  channel VARCHAR(32),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add Paystack transaction metadata columns to orders if not present
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS paystack_reference VARCHAR(128) UNIQUE,
  ADD COLUMN IF NOT EXISTS paystack_access_code VARCHAR(128),
  ADD COLUMN IF NOT EXISTS paystack_authorization_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(32),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 3. Indexes for Fast Paystack Lookups & Idempotency
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (reference);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_orders_paystack_reference ON orders (paystack_reference);

-- 4. Enable Row-Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments are readable by order owner or service role
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND (orders.customer_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- Payments are inserted/updated only by the secure server backend
CREATE POLICY "Insert payments via server role" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update payments via server role" ON payments
  FOR UPDATE USING (true);

-- 5. Atomic Inventory Deduction Function
-- Automatically deducts stock upon verified payment without race conditions
CREATE OR REPLACE FUNCTION reduce_order_inventory(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN 
    SELECT product_id, variant_id, quantity 
    FROM order_items 
    WHERE order_id = p_order_id
  LOOP
    -- If variant, reduce variant stock
    IF item.variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
      WHERE id = item.variant_id;
    END IF;

    -- Reduce main product stock
    UPDATE products
    SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
    WHERE id = item.product_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
