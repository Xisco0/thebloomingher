const cat = require('../src/lib/data/catalog.json');

const supabaseUrl = 'https://xbhyafrdczdazuueibeu.supabase.co';
const supabaseKey = 'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

async function testFetch() {
  console.log('Testing category POST...');
  const res = await fetch(`${supabaseUrl}/rest/v1/categories`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: cat.categories[0].id,
      name: cat.categories[0].name,
      slug: cat.categories[0].slug
    })
  });
  const text = await res.text();
  console.log('Categories status:', res.status, text);

  console.log('Testing products POST...');
  const res2 = await fetch(`${supabaseUrl}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: cat.products[0].id,
      name: cat.products[0].name,
      slug: cat.products[0].slug,
      sku: cat.products[0].sku,
      price: cat.products[0].price
    })
  });
  const text2 = await res2.text();
  console.log('Products status:', res2.status, text2);
}

testFetch();
