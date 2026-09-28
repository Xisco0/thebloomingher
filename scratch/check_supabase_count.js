const supabaseUrl = 'https://xbhyafrdczdazuueibeu.supabase.co';
const supabaseKey = 'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

async function queryProducts() {
  const res = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,price,sku,created_at&order=created_at.desc`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log('Total products currently in Supabase:', data.length);
  console.log('Top 5 products in Supabase:', data.slice(0, 5));
}

queryProducts();
