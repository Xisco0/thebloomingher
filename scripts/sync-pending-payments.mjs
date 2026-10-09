import { createClient } from '@supabase/supabase-js';

const flwSecret = 'FLWSECK-76e8464bc6e6309c9edc2de99b976c0e-1a1201883b3vt-X';
const url = 'https://xbhyafrdczdazuueibeu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiaHlhZnJkY3pkYXp1dWVpYmV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQxNTI1NywiZXhwIjoyMTA1OTkxMjU3fQ.GjI9Briil_AGVVRkQOYm7rs6HadX-EuMQXBdx94PRCo';
const headers = {
  'apikey': key,
  'Authorization': 'Bearer ' + key,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function syncAllPendingPayments() {
  console.log('Fetching all payment records from Supabase...');
  const pRes = await fetch(url + '/rest/v1/payments?select=*&order=created_at.desc', { headers });
  const payments = await pRes.json();
  console.log(`Total payments found in database: ${payments.length}`);

  let updatedCount = 0;

  for (const pay of payments) {
    if (pay.status === 'successful' || pay.status === 'paid') {
      continue;
    }

    console.log(`Checking Flutterwave API for reference: ${pay.reference} (DB Status: ${pay.status})...`);
    try {
      const flwRes = await fetch('https://api.flutterwave.com/v3/transactions?tx_ref=' + encodeURIComponent(pay.reference), {
        headers: { Authorization: 'Bearer ' + flwSecret }
      });
      const flwData = await flwRes.json();
      const tx = flwData?.data?.[0];

      if (tx && tx.status === 'successful') {
        console.log(`✔ FOUND SUCCESSFUL CHARGE on Flutterwave! Ref: ${pay.reference}, FLW ID: ${tx.id}, Amount: ${tx.amount} NGN`);

        // Update payment table
        await fetch(url + '/rest/v1/payments?reference=eq.' + encodeURIComponent(pay.reference), {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'successful',
            gateway_reference: String(tx.id),
            gateway_response: 'Approved & Auto-Reconciled',
            paid_at: tx.created_at,
            updated_at: new Date().toISOString()
          })
        });

        // Update orders table if order_id exists
        if (pay.order_id) {
          await fetch(url + '/rest/v1/orders?id=eq.' + encodeURIComponent(pay.order_id), {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              payment_status: 'paid',
              status: 'processing',
              order_status: 'processing',
              paid_at: tx.created_at,
              flutterwave_transaction_id: String(tx.id),
              updated_at: new Date().toISOString()
            })
          });
        }

        updatedCount++;
        console.log(`✔ Successfully updated payment ${pay.reference} to SUCCESSFUL!`);
      } else {
        console.log(`  Reference ${pay.reference} is not paid on Flutterwave.`);
      }
    } catch (err) {
      console.error(`Error checking reference ${pay.reference}:`, err.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`SYNC COMPLETE: ${updatedCount} payment(s) updated to SUCCESSFUL.`);
  console.log(`==================================================`);
}

syncAllPendingPayments();
