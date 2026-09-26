import { NextRequest, NextResponse } from 'next/server';
import { paystackService, orderService } from '@/services';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(new URL('/checkout?error=missing_reference', req.url));
  }

  try {
    // 1. Verify with Paystack API
    const verification = await paystackService.verifyTransaction(reference);

    if (!verification.success || !verification.data) {
      await paystackService.processFailedPayment(reference, verification.error);
      return NextResponse.redirect(
        new URL(`/checkout?error=payment_failed&ref=${encodeURIComponent(reference)}`, req.url)
      );
    }

    // 2. Process and mark order as paid
    const result = await paystackService.processSuccessfulPayment(reference, verification.data);

    if (!result.success || !result.order) {
      return NextResponse.redirect(
        new URL(`/checkout?error=order_not_found&ref=${encodeURIComponent(reference)}`, req.url)
      );
    }

    // 3. Redirect customer to order confirmation page with secure verification token
    const confirmationUrl = new URL(`/order-confirmation/${result.order.order_number}`, req.url);
    confirmationUrl.searchParams.set('status', 'paid');
    if (result.order.secure_token) {
      confirmationUrl.searchParams.set('token', result.order.secure_token);
    }

    return NextResponse.redirect(confirmationUrl);
  } catch (err: any) {
    console.error('[Paystack Verification Error]:', err);
    return NextResponse.redirect(
      new URL(`/checkout?error=verification_error&ref=${encodeURIComponent(reference)}`, req.url)
    );
  }
}
