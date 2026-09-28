import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { flutterwaveService } from '@/services';
import { getSiteUrl } from '@/lib/site-url';

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
    // Non-fatal if executed outside Next cache lifecycle
  }
}

/**
 * POST handler for Flutterwave Inline Overlay callback.
 * Receives { tx_ref, transaction_id, status } directly from client modal callback
 * and performs strict server-side verification with the Flutterwave API.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tx_ref, transaction_id, status } = body;

    const txRef = tx_ref || body.reference;

    if (!txRef) {
      return NextResponse.json(
        { success: false, error: 'Transaction reference is required for verification.' },
        { status: 400 }
      );
    }

    if (status === 'cancelled' || status === 'failed') {
      await flutterwaveService.processFailedPayment(txRef, `Payment ${status}`);
      return NextResponse.json(
        { success: false, error: 'Payment was cancelled or could not be completed.' },
        { status: 400 }
      );
    }

    let verificationData: any = undefined;

    // Verify transaction with official Flutterwave API
    if (transaction_id) {
      const verification = await flutterwaveService.verifyTransaction(String(transaction_id));
      if (!verification.success || !verification.data) {
        await flutterwaveService.processFailedPayment(txRef, verification.error || 'Flutterwave API verification failed');
        return NextResponse.json(
          { success: false, error: verification.error || 'Payment verification could not be confirmed.' },
          { status: 400 }
        );
      }
      verificationData = verification.data;
    }

    // Process payment idempotently: marks paid, deduces stock, saves audit record
    const result = await flutterwaveService.processSuccessfulPayment(
      txRef,
      verificationData,
      transaction_id ? String(transaction_id) : undefined
    );

    if (!result.success || !result.order) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update order payment status.' },
        { status: 422 }
      );
    }

    triggerRevalidation(result.order.order_number);

    return NextResponse.json({
      success: true,
      orderNumber: result.order.order_number,
      secureToken: result.order.secure_token || '',
      order: result.order,
    });
  } catch (err: any) {
    console.error('[Flutterwave POST Verification Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during verification.' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for redirect-based callbacks (e.g. hosted checkout returns or fallback).
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const searchParams = requestUrl.searchParams;

  const status = searchParams.get('status');
  const txRef = searchParams.get('tx_ref') || searchParams.get('reference');
  const transactionId = searchParams.get('transaction_id');

  // Compute dynamic base origin
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  const targetOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : (requestUrl.origin || getSiteUrl());

  // 1. Missing transaction reference check
  if (!txRef) {
    return NextResponse.redirect(new URL('/checkout?error=missing_reference', targetOrigin));
  }

  // 2. Handle customer cancellation / abandonment
  if (status === 'cancelled' || status === 'failed') {
    await flutterwaveService.processFailedPayment(txRef, `Payment ${status}`);
    return NextResponse.redirect(
      new URL(`/checkout?error=payment_cancelled&ref=${encodeURIComponent(txRef)}`, targetOrigin)
    );
  }

  try {
    let verificationData: any = undefined;

    // 3. Verify transaction with Flutterwave API if transaction_id provided
    if (transactionId) {
      const verification = await flutterwaveService.verifyTransaction(transactionId);

      if (!verification.success || !verification.data) {
        await flutterwaveService.processFailedPayment(txRef, verification.error || 'Verification rejected');
        return NextResponse.redirect(
          new URL(`/checkout?error=payment_failed&ref=${encodeURIComponent(txRef)}`, targetOrigin)
        );
      }

      verificationData = verification.data;
    }

    // 4. Process payment idempotently and safely update order to paid
    const result = await flutterwaveService.processSuccessfulPayment(
      txRef,
      verificationData,
      transactionId || undefined
    );

    if (!result.success || !result.order) {
      return NextResponse.redirect(
        new URL(`/checkout?error=${encodeURIComponent(result.error || 'order_not_found')}&ref=${encodeURIComponent(txRef)}`, targetOrigin)
      );
    }

    triggerRevalidation(result.order.order_number);

    // 5. Redirect customer to order confirmation page
    const confirmationUrl = new URL(`/order-confirmation/${result.order.order_number}`, targetOrigin);
    confirmationUrl.searchParams.set('status', 'paid');
    if (result.order.secure_token) {
      confirmationUrl.searchParams.set('token', result.order.secure_token);
    }

    return NextResponse.redirect(confirmationUrl);
  } catch (err: any) {
    console.error('[Flutterwave Verification Error]:', err);
    return NextResponse.redirect(
      new URL(`/checkout?error=verification_error&ref=${encodeURIComponent(txRef)}`, targetOrigin)
    );
  }
}
