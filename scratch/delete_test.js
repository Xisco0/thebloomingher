const supabaseUrl = 'https://xbhyafrdczdazuueibeu.supabase.co';
const supabaseKey = 'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

async function deleteTest() {
  const res = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.prod-test-1790549451257`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  console.log('Deleted test product status:', res.status);
}

deleteTest();
