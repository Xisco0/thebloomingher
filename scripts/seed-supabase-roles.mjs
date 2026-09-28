import fs from 'fs';
import path from 'path';

// Parse .env.local manually
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

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates,return=representation',
};

const defaultRoles = [
  {
    id: 'role-super-admin',
    name: 'Super Administrator',
    slug: 'super_admin',
    description: 'Full unrestricted system access with authority to manage administrators, roles, security, and all store features.',
    permissions: ['*'],
    is_system: true,
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
  },
];

async function main() {
  console.log('Direct HTTPS connection to Supabase REST API:', `${supabaseUrl}/rest/v1/roles`);

  // 1. Fetch current roles
  const getRes = await fetch(`${supabaseUrl}/rest/v1/roles?select=*`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  });

  if (!getRes.ok) {
    const errText = await getRes.text();
    console.error('Error fetching roles from Supabase:', errText);
  } else {
    const roles = await getRes.json();
    console.log('Existing roles in DB before sync:', roles.map(r => ({ id: r.id, name: r.name, slug: r.slug })));
  }

  // 2. Upsert each role
  for (const role of defaultRoles) {
    const postRes = await fetch(`${supabaseUrl}/rest/v1/roles?on_conflict=slug`, {
      method: 'POST',
      headers,
      body: JSON.stringify(role),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.error(`Error upserting ${role.name}:`, errText);
    } else {
      const result = await postRes.json();
      console.log(`Successfully synced role ${role.name} (${role.slug}) into Supabase!`);
    }
  }

  // 3. Verify final list in Supabase
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/roles?select=*`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  });
  const finalRoles = await verifyRes.json();
  console.log('\n--- Final roles in Supabase DB ---');
  console.table(finalRoles.map(r => ({ id: r.id, name: r.name, slug: r.slug, is_system: r.is_system })));
}

main().catch(console.error);
