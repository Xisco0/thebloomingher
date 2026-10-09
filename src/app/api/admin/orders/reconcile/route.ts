import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { flutterwaveService } from '@/services';
import { requireAdminAuth } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

function triggerRevalidation() {
  try {
    revalidatePath('/account');
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
  } catch (e) {}
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'orders.edit');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await req.json();
    const { reference, flwTransactionId, amount, customerName, customerEmail, customerPhone, notes } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Transaction reference is required for reconciliation.' },
        { status: 400 }
      );
    }

    const result = await flutterwaveService.reconcilePayment({
      reference,
      flwTransactionId,
      amount: amount ? Number(amount) : undefined,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Reconciliation failed.' },
        { status: 400 }
      );
    }

    triggerRevalidation();

    return NextResponse.json({
      success: true,
      order: result.order,
      message: result.message || 'Transaction reconciled successfully.',
    });
  } catch (err: any) {
    console.error('[Reconciliation Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reconcile payment transaction.' },
      { status: 500 }
    );
  }
}
