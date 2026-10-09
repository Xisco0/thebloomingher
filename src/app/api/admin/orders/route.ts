import { NextRequest, NextResponse } from 'next/server';
import { orderRepository } from '@/repositories';
import { flutterwaveService } from '@/services';
import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'orders.view');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    // Opportunistically mark orders older than 30 minutes as abandoned
    try {
      await orderRepository.markAbandonedOrders(30);
    } catch (e) {
      console.warn('[Admin Orders GET] Background abandonment sweep notice:', e);
    }

    const [orders, payments] = await Promise.all([
      orderRepository.getAllOrders(),
      orderRepository.getPayments(),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      payments,
    });
  } catch (error: any) {
    console.error('[Admin Orders GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'orders.edit');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await req.json();
    const { orderId, orderStatus, action, refundAmount, reason } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required.' },
        { status: 400 }
      );
    }

    // 1. Process Refund Action
    if (action === 'refund') {
      const order = await orderRepository.getOrderById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }
      const amount = refundAmount ? Number(refundAmount) : order.total_amount;
      const updated = await orderRepository.recordRefund(orderId, amount, reason);
      return NextResponse.json({ success: true, order: updated, message: 'Refund recorded successfully.' });
    }

    // 1b. Overpayment Review & Refund Actions
    if (action === 'approve_overpayment' || action === 'reject_overpayment') {
      const reviewAction = action === 'approve_overpayment' ? 'approve' : 'reject';
      const result = await flutterwaveService.reviewOverpayment({
        orderId,
        action: reviewAction,
        notes: reason,
        adminUser: auth.admin?.email || 'Admin',
      });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        order: result.order,
        message: `Overpayment review ${reviewAction}d successfully.`,
      });
    }

    if (action === 'process_overpayment_refund') {
      const result = await flutterwaveService.processOverpaymentRefund({
        orderId,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        reason,
        adminUser: auth.admin?.email || 'Admin',
      });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        order: result.order,
        message: 'Overpayment refund processed successfully.',
      });
    }

    // 2. Standard Fulfilment Status Update
    if (!orderStatus) {
      return NextResponse.json(
        { success: false, error: 'orderStatus is required.' },
        { status: 400 }
      );
    }

    const targetOrder = await orderRepository.getOrderById(orderId);
    if (targetOrder && targetOrder.payment_status !== 'paid' && targetOrder.payment_status !== 'successful') {
      if (['processing', 'shipped', 'delivered'].includes(orderStatus)) {
        return NextResponse.json(
          { success: false, error: 'Fulfillment status cannot be updated until payment is confirmed.' },
          { status: 400 }
        );
      }
    }

    const validStatuses: OrderStatus[] = [
      'pending',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'payment_failed',
      'abandoned',
      'refunded',
    ];

    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order status value.' },
        { status: 400 }
      );
    }

    const updated = await orderRepository.updateOrderStatus(orderId, orderStatus);

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('[Admin Orders PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status.' },
      { status: 500 }
    );
  }
}
