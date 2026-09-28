-- ==============================================================================
-- 010: Role-Based Access Control (RBAC) & Administrator Management Schema
-- ==============================================================================

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY DEFAULT 'role_' || gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Permissions Catalog Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Admin Users Table with RBAC Columns
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

-- 4. Create Admin Audit Logs Table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON public.admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON public.admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
CREATE POLICY "Service role full access on roles" ON public.roles FOR ALL USING (true);
CREATE POLICY "Service role full access on permissions" ON public.permissions FOR ALL USING (true);
CREATE POLICY "Service role full access on admin_users" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Service role full access on admin_audit_logs" ON public.admin_audit_logs FOR ALL USING (true);

-- Seed System Default Roles
INSERT INTO public.roles (id, name, slug, description, permissions, is_system)
VALUES
    ('role-super-admin', 'Super Administrator', 'super_admin', 'Full unrestricted system access with authority to manage administrators, roles, security, and all store features.', '["*"]'::jsonb, true),
    ('role-admin', 'Administrator', 'admin', 'Comprehensive store management across all products, orders, marketing, customers, and staff management.', '["analytics.view", "banners.view", "banners.manage", "campaigns.view", "campaigns.manage", "events.view", "events.manage", "promotions.view", "promotions.manage", "announcements.view", "announcements.manage", "coupons.view", "coupons.manage", "media.view", "media.manage", "products.view", "products.manage", "categories.view", "categories.manage", "collections.view", "collections.manage", "inventory.view", "inventory.manage", "reviews.view", "reviews.manage", "orders.view", "orders.manage", "customers.view", "customers.manage", "admins.view", "admins.manage", "roles.view", "settings.view", "settings.manage", "audit_logs.view"]'::jsonb, true),
    ('role-staff', 'Staff', 'staff', 'Store operational staff with access to manage products, orders, inventory, customers, and marketing. Cannot view/add staff or access store settings.', '["analytics.view", "banners.view", "banners.manage", "campaigns.view", "campaigns.manage", "events.view", "events.manage", "promotions.view", "promotions.manage", "announcements.view", "announcements.manage", "coupons.view", "coupons.manage", "media.view", "media.manage", "products.view", "products.manage", "categories.view", "categories.manage", "collections.view", "collections.manage", "inventory.view", "inventory.manage", "reviews.view", "reviews.manage", "orders.view", "orders.manage", "customers.view", "customers.manage"]'::jsonb, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();
