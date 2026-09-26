import { NextRequest, NextResponse } from 'next/server';
import { orderRepository } from '@/repositories';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await orderRepository.getAllOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('[Admin Orders GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderStatus } = body;

    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { success: false, error: 'orderId and orderStatus are required' },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = [
      'pending',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'payment_failed',
      'refunded',
    ];

    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order status transition' },
        { status: 400 }
      );
    }

    const updated = await orderRepository.updateOrderStatus(orderId, orderStatus);

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('[Admin Orders PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
