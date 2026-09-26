import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { cmsStore } from '@/lib/cms-store';
import { orderRepository } from '@/repositories';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySessionToken(token);

    if (!session || session.role !== 'customer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customer = cmsStore.getCustomerById(session.userId);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const { password_hash, ...safeCustomer } = customer;

    // Fetch customer's order history
    const allOrders = await orderRepository.getAllOrders();
    const customerOrders = allOrders.filter(
      o => o.customer_email.toLowerCase() === customer.email.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      customer: safeCustomer,
      orders: customerOrders,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session || session.role !== 'customer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updated = cmsStore.updateCustomerProfile(session.userId, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      customer: updated,
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
