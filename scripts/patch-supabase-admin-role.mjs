import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbhyafrdczdazuueibeu.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const adminPermissions = [
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
];

async function updateAdmin() {
  // Update name, description, and permissions for admin role
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/roles?slug=eq.admin`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      name: 'Administrator',
      description: 'Comprehensive store management across all products, orders, marketing, customers, and staff management.',
      permissions: adminPermissions,
    }),
  });

  const updated = await patchRes.json();
  console.log('Updated Admin Role in Supabase:', updated);

  // Fetch all roles to verify
  const allRes = await fetch(`${supabaseUrl}/rest/v1/roles?select=*`, { headers });
  const allRoles = await allRes.json();
  console.log('\n--- All Live Roles in Supabase Database ---');
  console.table(allRoles.map(r => ({ id: r.id, name: r.name, slug: r.slug, permissions_count: r.permissions?.length })));
}

updateAdmin().catch(console.error);
