import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/services';
import { verifyPaystackSignature } from '@/lib/utils/paystack';
import { PaystackWebhookEvent } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secretKey = process.env.PAYSTACK_SECRET_KEY || '';

    // Verify HMAC-SHA512 Signature (in production when secret key is provided)
    if (secretKey && !secretKey.startsWith('pk_')) {
      const isSignatureValid = verifyPaystackSignature(rawBody, signature, secretKey);
      if (!isSignatureValid) {
        console.warn('[Paystack Webhook] Invalid HMAC signature rejected');
        return NextResponse.json({ status: false, message: 'Invalid signature' }, { status: 401 });
      }
    }

    const event: PaystackWebhookEvent = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { reference } = event.data;
      if (reference) {
        await paystackService.processSuccessfulPayment(reference, event.data);
      }
    } else if (event.event === 'charge.failed') {
      const { reference, gateway_response } = event.data;
      if (reference) {
        await paystackService.processFailedPayment(reference, gateway_response || 'Payment charge failed');
      }
    }

    return NextResponse.json({ status: true, message: 'Webhook event processed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[Paystack Webhook Error]:', error);
    // Return 200 to acknowledge receipt and prevent infinite Paystack retries for malformed payloads
    return NextResponse.json({ status: false, message: 'Webhook processing error' }, { status: 200 });
  }
}
