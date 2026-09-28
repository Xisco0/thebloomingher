import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { flutterwaveService } from '@/services';
import { verifyFlutterwaveSignature } from '@/lib/utils/flutterwave';
import { FlutterwaveWebhookEvent } from '@/types';

export const dynamic = 'force-dynamic';

function triggerRevalidation(orderNumber?: string) {
  try {
    revalidatePath('/account');
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/admin/inventory');
    if (orderNumber) {
      revalidatePath(`/order-confirmation/${orderNumber}`);
    }
  } catch (e) {
    // Non-fatal if outside Next.js cache lifecycle
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('verif-hash');
    const secretHash = process.env.FLW_SECRET_HASH || process.env.FLW_SECRET_KEY || '';

    // 1. Webhook Signature / Secret Hash Verification
    if (secretHash && !secretHash.startsWith('FLWPUBK')) {
      const isSignatureValid = verifyFlutterwaveSignature(signature, secretHash);
      if (!isSignatureValid) {
        console.warn('[Flutterwave Webhook] Invalid verif-hash signature rejected');
        return NextResponse.json({ status: false, message: 'Invalid signature' }, { status: 401 });
      }
    }

    const event: FlutterwaveWebhookEvent = JSON.parse(rawBody);

    if (event.data) {
      const txRef = event.data.tx_ref;
      const status = event.data.status;
      const transactionId = event.data.id ? String(event.data.id) : undefined;

      if (txRef && status === 'successful') {
        // Re-verify with Flutterwave API if transaction ID is present
        let verifiedData: any = event.data;
        if (transactionId) {
          const apiVerify = await flutterwaveService.verifyTransaction(transactionId);
          if (apiVerify.success && apiVerify.data) {
            verifiedData = apiVerify.data;
          }
        }

        // Idempotent processing: marks paid, reduces inventory once, writes audit logs
        const result = await flutterwaveService.processSuccessfulPayment(txRef, verifiedData, transactionId);
        if (result.success && result.order) {
          triggerRevalidation(result.order.order_number);
        }
      } else if (txRef && (status === 'failed' || status === 'cancelled')) {
        await flutterwaveService.processFailedPayment(txRef, `Webhook status: ${status}`);
      }
    }

    return NextResponse.json(
      { status: true, message: 'Webhook event processed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Flutterwave Webhook Error]:', error);
    // Return 200 to acknowledge receipt and prevent infinite Flutterwave retries for malformed payloads
    return NextResponse.json(
      { status: false, message: 'Webhook processing error' },
      { status: 200 }
    );
  }
}
