-- Migration 011: Flutterwave Payment Integration & Multi-Gateway Support
-- Adds Flutterwave transaction tracking, unified payment references, and idempotent inventory deduction

-- 1. Extend Orders table with Flutterwave & Multi-Gateway Columns
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32) DEFAULT 'flutterwave',
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(128) UNIQUE,
  ADD COLUMN IF NOT EXISTS flutterwave_reference VARCHAR(128) UNIQUE,
  ADD COLUMN IF NOT EXISTS flutterwave_transaction_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS flutterwave_authorization_url TEXT;

-- 2. Backfill payment_reference for existing Paystack orders if empty
UPDATE orders 
SET payment_reference = paystack_reference 
WHERE payment_reference IS NULL AND paystack_reference IS NOT NULL;

-- 3. High-Performance Indexes for Flutterwave Verification & Webhook Lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders (payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders (payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_flutterwave_reference ON orders (flutterwave_reference);
CREATE INDEX IF NOT EXISTS idx_orders_flutterwave_transaction_id ON orders (flutterwave_transaction_id);

-- 4. Atomic Inventory Reduction Function
-- Idempotently and safely deducts inventory upon verified payment confirmation
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
