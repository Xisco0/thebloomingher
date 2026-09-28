const supabaseUrl = 'https://xbhyafrdczdazuueibeu.supabase.co';
const supabaseKey = 'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

async function testInsert() {
  const testProduct = {
    id: 'prod-test-' + Date.now(),
    name: 'Test Product ' + Date.now(),
    slug: 'test-product-' + Date.now(),
    sku: 'TBH-' + Math.floor(100000 + Math.random() * 900000),
    price: 5000,
    currency: 'NGN',
    status: 'active',
    category_id: 'cat-18130',
    category_name: 'Feminine Care',
    description: 'Test description',
    images: ['/images/logo.jpg']
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testProduct)
  });

  const text = await res.text();
  console.log('Insert Status:', res.status);
  console.log('Response Body:', text);
}

testInsert();
