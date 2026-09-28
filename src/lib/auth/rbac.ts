import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth/jwt';
import { PermissionDefinition, Role, AuthSessionPayload } from '@/types/auth.types';

// System Permission Definitions categorized by module
export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Overview & Analytics
  { id: 'perm-analytics-view', code: 'analytics.view', name: 'View Analytics & Reports', module: 'Overview & Analytics', description: 'Access store performance, revenue charts, and conversion analytics' },
  
  // Content & Marketing
  { id: 'perm-banners-view', code: 'banners.view', name: 'View Banners', module: 'Content & Marketing', description: 'Browse and preview homepage and promotional banners' },
  { id: 'perm-banners-manage', code: 'banners.manage', name: 'Manage Banners', module: 'Content & Marketing', description: 'Create, edit, schedule, reorder, and archive marketing banners' },
  { id: 'perm-campaigns-view', code: 'campaigns.view', name: 'View Campaigns', module: 'Content & Marketing', description: 'View marketing campaigns and timelines' },
  { id: 'perm-campaigns-manage', code: 'campaigns.manage', name: 'Manage Campaigns', module: 'Content & Marketing', description: 'Create, edit, launch, and manage promotional campaigns' },
  { id: 'perm-events-view', code: 'events.view', name: 'View Events & Workshops', module: 'Content & Marketing', description: 'View wellness events, community workshops, and attendee stats' },
  { id: 'perm-events-manage', code: 'events.manage', name: 'Manage Events & Workshops', module: 'Content & Marketing', description: 'Create, edit, manage ticketing and attendance for events' },
  { id: 'perm-promotions-view', code: 'promotions.view', name: 'View Promotions', module: 'Content & Marketing', description: 'View seasonal sales and promotional offers' },
  { id: 'perm-promotions-manage', code: 'promotions.manage', name: 'Manage Promotions', module: 'Content & Marketing', description: 'Create and update promotional sales and discounts' },
  { id: 'perm-announcements-view', code: 'announcements.view', name: 'View Announcements', module: 'Content & Marketing', description: 'View top-bar and modal store announcements' },
  { id: 'perm-announcements-manage', code: 'announcements.manage', name: 'Manage Announcements', module: 'Content & Marketing', description: 'Create, schedule, color-style, and publish store announcements' },
  { id: 'perm-coupons-view', code: 'coupons.view', name: 'View Discount Coupons', module: 'Content & Marketing', description: 'Browse coupon codes and usage rules' },
  { id: 'perm-coupons-manage', code: 'coupons.manage', name: 'Manage Discount Coupons', module: 'Content & Marketing', description: 'Create, adjust limits, and disable discount coupon codes' },
  { id: 'perm-media-view', code: 'media.view', name: 'View Media Library', module: 'Content & Marketing', description: 'Browse uploaded images and brand assets' },
  { id: 'perm-media-manage', code: 'media.manage', name: 'Manage Media Library', module: 'Content & Marketing', description: 'Upload, tag, organize, and delete media files' },

  // Store & Inventory
  { id: 'perm-products-view', code: 'products.view', name: 'View Products', module: 'Store & Inventory', description: 'Browse products catalog, pricing, and variant options' },
  { id: 'perm-products-manage', code: 'products.manage', name: 'Manage Products', module: 'Store & Inventory', description: 'Create, update, publish, and delete store products' },
  { id: 'perm-categories-view', code: 'categories.view', name: 'View Categories', module: 'Store & Inventory', description: 'View product categories hierarchy' },
  { id: 'perm-categories-manage', code: 'categories.manage', name: 'Manage Categories', module: 'Store & Inventory', description: 'Create, edit, and reorganize product categories' },
  { id: 'perm-collections-view', code: 'collections.view', name: 'View Collections', module: 'Store & Inventory', description: 'View curated product collections' },
  { id: 'perm-collections-manage', code: 'collections.manage', name: 'Manage Collections', module: 'Store & Inventory', description: 'Create and configure featured collections' },
  { id: 'perm-inventory-view', code: 'inventory.view', name: 'View Inventory & Stock', module: 'Store & Inventory', description: 'Monitor inventory levels, low stock warnings, and SKUs' },
  { id: 'perm-inventory-manage', code: 'inventory.manage', name: 'Manage Inventory & Stock', module: 'Store & Inventory', description: 'Adjust warehouse stock quantities and inventory alerts' },
  { id: 'perm-reviews-view', code: 'reviews.view', name: 'View Customer Reviews', module: 'Store & Inventory', description: 'Read customer feedback, ratings, and testimonials' },
  { id: 'perm-reviews-manage', code: 'reviews.manage', name: 'Manage Customer Reviews', module: 'Store & Inventory', description: 'Approve, feature, respond to, or remove product reviews' },

  // Orders & Customers
  { id: 'perm-orders-view', code: 'orders.view', name: 'View Orders', module: 'Orders & Customers', description: 'View customer orders, delivery status, and payment slips' },
  { id: 'perm-orders-manage', code: 'orders.manage', name: 'Manage Orders', module: 'Orders & Customers', description: 'Update order status, fulfillment, dispatch notes, and tracking' },
  { id: 'perm-customers-view', code: 'customers.view', name: 'View Customers', module: 'Orders & Customers', description: 'Browse customer profiles, contact info, and purchase histories' },
  { id: 'perm-customers-manage', code: 'customers.manage', name: 'Manage Customers', module: 'Orders & Customers', description: 'Edit customer records, notes, and account statuses' },

  // Administration & System
  { id: 'perm-admins-view', code: 'admins.view', name: 'View Administrators', module: 'Administration & System', description: 'List administrators and their assigned roles' },
  { id: 'perm-admins-manage', code: 'admins.manage', name: 'Manage Administrators', module: 'Administration & System', description: 'Invite admins, change roles, deactivate, and reset passwords' },
  { id: 'perm-roles-view', code: 'roles.view', name: 'View Roles & Permissions', module: 'Administration & System', description: 'Inspect available roles and their permission mappings' },
  { id: 'perm-roles-manage', code: 'roles.manage', name: 'Manage Roles & Permissions', module: 'Administration & System', description: 'Create custom roles, edit permission matrices, and configure RBAC' },
  { id: 'perm-settings-view', code: 'settings.view', name: 'View Store Settings', module: 'Administration & System', description: 'View store profile, shipping thresholds, and SEO settings' },
  { id: 'perm-settings-manage', code: 'settings.manage', name: 'Manage Store Settings', module: 'Administration & System', description: 'Update store branding, contact info, shipping rates, and SEO meta' },
  { id: 'perm-audit-logs-view', code: 'audit_logs.view', name: 'View Audit Trail', module: 'Administration & System', description: 'Inspect security audit logs and administrative activity records' },
];

export const ALL_PERMISSION_CODES = SYSTEM_PERMISSIONS.map(p => p.code);

// Default Pre-seeded Roles
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-super-admin',
    name: 'Super Administrator',
    slug: 'super_admin',
    description: 'Full unrestricted system access with authority to manage administrators, roles, security, and all store features.',
    permissions: ['*'], // Wildcard - matches everything
    is_system: true,
    user_count: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-admin',
    name: 'Administrator',
    slug: 'admin',
    description: 'Comprehensive store management across all products, orders, marketing, customers, and staff management.',
    permissions: [
      'analytics.view',
      'banners.view', 'banners.manage',
      'campaigns.view', 'campaigns.manage',
      'events.view', 'events.manage',
      'promotions.view', 'promotions.manage',
      'announcements.view', 'announcements.manage',
      'coupons.view', 'coupons.manage',
      'media.view', 'media.manage',
      'products.view', 'products.manage',
      'categories.view', 'categories.manage',
      'collections.view', 'collections.manage',
      'inventory.view', 'inventory.manage',
      'reviews.view', 'reviews.manage',
      'orders.view', 'orders.manage',
      'customers.view', 'customers.manage',
      'admins.view', 'admins.manage',
      'roles.view',
      'settings.view', 'settings.manage',
      'audit_logs.view',
    ],
    is_system: true,
    user_count: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-staff',
    name: 'Staff',
    slug: 'staff',
    description: 'Store operational staff with access to manage products, orders, inventory, customers, and marketing. Cannot view/add staff or access store settings.',
    permissions: [
      'analytics.view',
      'banners.view', 'banners.manage',
      'campaigns.view', 'campaigns.manage',
      'events.view', 'events.manage',
      'promotions.view', 'promotions.manage',
      'announcements.view', 'announcements.manage',
      'coupons.view', 'coupons.manage',
      'media.view', 'media.manage',
      'products.view', 'products.manage',
      'categories.view', 'categories.manage',
      'collections.view', 'collections.manage',
      'inventory.view', 'inventory.manage',
      'reviews.view', 'reviews.manage',
      'orders.view', 'orders.manage',
      'customers.view', 'customers.manage',
    ],
    is_system: true,
    user_count: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
];

/**
 * Checks whether a given list of user permissions grants access to a required permission.
 * Supports:
 * - '*' (super admin wildcard)
 * - 'module.*' (e.g. 'banners.*')
 * - exact matches (e.g. 'banners.manage')
 */
export function hasPermission(userPermissions: string[] | undefined, requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  const [module] = requiredPermission.split('.');
  if (module && userPermissions.includes(`${module}.*`)) {
    return true;
  }

  return false;
}

/**
 * Checks whether a given list of user permissions grants ANY of the specified permissions.
 */
export function hasAnyPermission(userPermissions: string[] | undefined, requiredPermissions: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
}

/**
 * Checks whether a given list of user permissions grants ALL of the specified permissions.
 */
export function hasAllPermissions(userPermissions: string[] | undefined, requiredPermissions: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
}

/**
 * Server-side helper to verify that an incoming request has an authenticated admin session
 * and the required permission.
 */
export async function requireAdminPermission(
  req: NextRequest,
  requiredPermission: string
): Promise<{ authorized: boolean; session?: AuthSessionPayload; errorResponse?: NextResponse }> {
  const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!adminToken) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication required. Please log in as an administrator.' },
        { status: 401 }
      ),
    };
  }

  const session = await verifySessionToken(adminToken);
  if (!session) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      ),
    };
  }

  // Check if force password change is active
  if (session.mustChangePassword) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Password update required. Please change your temporary password before proceeding.',
          mustChangePassword: true,
        },
        { status: 403 }
      ),
    };
  }

  const isAllowed = hasPermission(session.permissions, requiredPermission);
  if (!isAllowed) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Permission denied: Your role does not have authorization for '${requiredPermission}'.`,
          requiredPermission,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}
