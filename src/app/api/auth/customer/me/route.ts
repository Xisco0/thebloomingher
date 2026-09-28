import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, createSessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { cmsStore } from '@/lib/cms-store';
import { orderRepository } from '@/repositories';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

    let customerId: string | null = null;
    let customerEmail: string | null = null;
    let customerName: string | null = null;
    let fallbackToken: string | null = null;

    if (token) {
      const session = await verifySessionToken(token);
      if (session && session.role === 'customer') {
        customerId = session.userId;
        customerEmail = session.email;
        customerName = session.name;
      }
    }

    // If no JWT cookie or expired, check Supabase server session
    if (!customerId) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && user.email) {
          const authRes = await authService.customerGoogleAuth({
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            googleId: user.id,
            avatarUrl: user.user_metadata?.avatar_url,
          });

          if (authRes.success && authRes.customer) {
            customerId = authRes.customer.id;
            customerEmail = authRes.customer.email;
            customerName = `${authRes.customer.first_name} ${authRes.customer.last_name}`;
            fallbackToken = authRes.token || null;
          }
        }
      } catch (err) {
        // Ignore Supabase check errors
      }
    }

    if (!customerId && !customerEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let customer = customerId ? cmsStore.getCustomerById(customerId) : undefined;
    if (!customer && customerEmail) {
      customer = cmsStore.getCustomerByEmail(customerEmail);
    }

    // Direct fetch from Supabase customers table if not in memory
    if (!customer && (customerId || customerEmail)) {
      try {
        let query = supabaseAdmin.from('customers').select('*');
        if (customerId) {
          query = query.or(`id.eq.${customerId},email.eq.${customerEmail || customerId}`);
        } else if (customerEmail) {
          query = query.eq('email', customerEmail);
        }
        const { data: dbCustomer } = await query.maybeSingle();

        if (dbCustomer) {
          customer = cmsStore.createCustomer({
            id: dbCustomer.id,
            first_name: dbCustomer.first_name,
            last_name: dbCustomer.last_name,
            email: dbCustomer.email,
            password_hash: dbCustomer.password_hash,
            phone: dbCustomer.phone || '',
            is_active: dbCustomer.is_active !== false,
            delivery_address: dbCustomer.delivery_address || undefined,
          });
        }
      } catch (e) {}
    }

    // Auto-heal / restore customer if session is valid
    if (!customer && customerEmail) {
      const parts = (customerName || '').trim().split(' ');
      const first = parts[0] || customerEmail.split('@')[0] || 'Customer';
      const last = parts.slice(1).join(' ') || '';
      customer = cmsStore.createCustomer({
        id: customerId || undefined,
        first_name: first,
        last_name: last,
        email: customerEmail,
        password_hash: '',
        is_active: true,
      });

      // Save to Supabase
      try {
        await supabaseAdmin.from('customers').upsert({
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          password_hash: '',
          is_active: true,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {}
    }

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { password_hash, ...safeCustomer } = customer;

    // Fetch customer's order history
    const allOrders = await orderRepository.getAllOrders();
    const customerOrders = allOrders.filter(
      o => o.customer_email.toLowerCase() === customer.email.toLowerCase()
    );

    const response = NextResponse.json({
      success: true,
      customer: safeCustomer,
      orders: customerOrders,
    });

    if (fallbackToken) {
      response.cookies.set({
        name: CUSTOMER_COOKIE_NAME,
        value: fallbackToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
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

    // Sync updates to Supabase
    try {
      await supabaseAdmin.from('customers').update({
        first_name: body.first_name || updated?.first_name,
        last_name: body.last_name || updated?.last_name,
        phone: body.phone !== undefined ? body.phone : updated?.phone,
        delivery_address: body.delivery_address || updated?.delivery_address,
        updated_at: new Date().toISOString(),
      }).or(`id.eq.${session.userId},email.eq.${session.email}`);
    } catch (e) {
      console.warn('[Supabase Customer Update Notice]:', e);
    }

    return NextResponse.json({
      success: true,
      customer: updated || body,
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
