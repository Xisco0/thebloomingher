-- ==============================================================================
-- TheBloomingHer Care & Wellness — Row Level Security (RLS) & Authorization
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (role = 'admin')
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile non-role fields" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (is_admin());

-- 2. CATEGORIES POLICIES
CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (is_admin());

-- 3. PRODUCTS POLICIES
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (is_admin());

-- 4. PRODUCT IMAGES POLICIES
CREATE POLICY "Public can view product images" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product images" ON product_images
    FOR ALL USING (is_admin());

-- 5. PRODUCT VARIANTS POLICIES
CREATE POLICY "Public can view product variants" ON product_variants
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product variants" ON product_variants
    FOR ALL USING (is_admin());

-- 6. INVENTORY POLICIES
CREATE POLICY "Public can view inventory levels" ON inventory
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON inventory
    FOR ALL USING (is_admin());

-- 7. ORDERS POLICIES
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR is_admin()
    );

CREATE POLICY "Anyone can create pending orders" ON orders
    FOR INSERT WITH CHECK (payment_status = 'pending');

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (is_admin());

-- 8. ORDER ITEMS POLICIES
CREATE POLICY "Customers can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (orders.customer_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "Anyone can insert order items during order creation" ON order_items
    FOR INSERT WITH CHECK (true);

-- 9. REVIEWS POLICIES
CREATE POLICY "Public can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved' OR is_admin());

CREATE POLICY "Authenticated users can submit reviews" ON reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage reviews" ON reviews
    FOR ALL USING (is_admin());

-- 10. HOMEPAGE SECTIONS POLICIES
CREATE POLICY "Public can view active homepage sections" ON homepage_sections
    FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage homepage sections" ON homepage_sections
    FOR ALL USING (is_admin());

-- 11. PRODUCT EVENTS POLICIES
CREATE POLICY "Anyone can insert events" ON product_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view events" ON product_events
    FOR SELECT USING (is_admin());
