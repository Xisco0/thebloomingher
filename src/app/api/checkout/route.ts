import { NextRequest, NextResponse } from 'next/server';
import { checkoutService } from '@/services';
import { CheckoutFormSchema } from '@/lib/validation/checkout.schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const origin = req.headers.get('origin') || new URL(req.url).origin;

    // 1. Schema validation
    const parseResult = CheckoutFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    // 2. Authoritative server-side price, inventory calculation & Paystack initialization
    const result = await checkoutService.processCheckout(parseResult.data, origin);

    if (!result.success || !result.order) {
      return NextResponse.json(
        {
          success: false,
          errors: result.errors || ['Checkout processing failed'],
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      orderNumber: result.order.order_number,
      totalAmount: result.order.total_amount,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      reference: result.reference,
    });
  } catch (error: any) {
    console.error('Unhandled checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: [
          'An unexpected error occurred while processing your order. Please try again or contact customer care on WhatsApp.',
        ],
      },
      { status: 500 }
    );
  }
}
