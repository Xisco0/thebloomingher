import { NextResponse } from 'next/server';
import { orderRepository } from '@/repositories';
import { CustomerProfile } from '@/types/cms.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await orderRepository.getAllOrders();

    // Group orders by customer email or phone
    const customerMap = new Map<string, CustomerProfile>();

    orders.forEach(order => {
      const email = order.customer_email.toLowerCase().trim();
      const existing = customerMap.get(email);

      if (existing) {
        existing.ordersCount += 1;
        if (order.payment_status === 'paid') {
          existing.totalSpent += order.total_amount;
        }
        if (!existing.lastOrderDate || new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
      } else {
        customerMap.set(email, {
          id: `cust-${Math.random().toString(36).substring(2, 9)}`,
          fullName: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          ordersCount: 1,
          totalSpent: order.payment_status === 'paid' ? order.total_amount : 0,
          lastOrderDate: order.created_at,
          createdAt: order.created_at,
        });
      }
    });

    const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
