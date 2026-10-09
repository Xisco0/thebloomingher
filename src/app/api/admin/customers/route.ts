import { NextResponse } from 'next/server';
import { orderRepository } from '@/repositories';
import { CustomerProfile } from '@/types/cms.types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await orderRepository.getAllOrders();
    const customerMap = new Map<string, CustomerProfile>();

    // 1. Fetch registered customer accounts from Supabase
    try {
      const { data: dbCustomers, error } = await supabaseAdmin
        .from('customers')
        .select('*');

      if (!error && dbCustomers) {
        dbCustomers.forEach((c: any) => {
          const email = (c.email || '').toLowerCase().trim();
          if (email) {
            customerMap.set(email, {
              id: c.id,
              fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Registered Customer',
              email: c.email,
              phone: c.phone || '',
              ordersCount: 0,
              totalSpent: 0,
              createdAt: c.created_at || new Date().toISOString(),
            });
          }
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Customers GET] Supabase customers fetch error:', dbErr);
    }

    // 2. Aggregate from orders
    orders.forEach(order => {
      const email = order.customer_email.toLowerCase().trim();
      const existing = customerMap.get(email);
      const isPaid = order.payment_status === 'paid' || order.payment_status === 'successful';

      if (existing) {
        existing.ordersCount += 1;
        if (isPaid) {
          existing.totalSpent += order.total_amount;
        }
        if (!existing.lastOrderDate || new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
      } else {
        customerMap.set(email, {
          id: order.customer_id || `cust-${Math.random().toString(36).substring(2, 9)}`,
          fullName: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          ordersCount: 1,
          totalSpent: isPaid ? order.total_amount : 0,
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

