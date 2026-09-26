/**
 * TheBloomingHer Care & Wellness — Supabase Seeding Script
 * Run with: node scripts/seed-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xbhyafrdczdazuueibeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log('🌸 TheBloomingHer Care & Wellness — Supabase Migration & Seed Runner');
  console.log('Supabase URL:', SUPABASE_URL);

  const sqlFilePath = path.join(__dirname, '..', 'supabase', 'schema_and_seed.sql');
  if (fs.existsSync(sqlFilePath)) {
    console.log(`\n📄 SQL Master Migration file is ready at: supabase/schema_and_seed.sql`);
    console.log(`💡 You can execute this file directly in the Supabase SQL Editor: https://supabase.com/dashboard/project/xbhyafrdczdazuueibeu/sql`);
  }

  // Attempt to test table accessibility
  try {
    const { data: catData, error: catError } = await supabase.from('categories').select('*').limit(5);
    if (!catError && catData) {
      console.log(`\n✅ Connected to categories table. Found ${catData.length} categories.`);
    } else {
      console.log(`\nℹ️ Categories table not yet detected in schema cache: ${catError?.message || 'Run schema_and_seed.sql in Supabase SQL Editor'}`);
    }
  } catch (err) {
    console.log('Notice:', err.message);
  }
}

main();
