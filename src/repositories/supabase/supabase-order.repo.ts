import { IOrderRepository } from '../interfaces';
import { Order, CreateOrderDTO, PaymentStatus, OrderStatus, PaymentRecord, OrderItem } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabaseOrderRepository implements IOrderRepository {
  private ordersStore: Map<string, Order> = new Map();
  private paymentsStore: Map<string, PaymentRecord> = new Map();

  private normalizePaymentStatus(status: string | undefined): PaymentStatus {
    if (!status) return 'pending';
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'successful' || s === 'success') return 'successful';
    if (s === 'failed' || s === 'payment_failed') return 'failed';
    if (s === 'abandoned') return 'abandoned';
    if (s === 'cancelled') return 'cancelled';
    if (s === 'refunded') return 'refunded';
    return 'pending';
  }

  private mapDbOrderToModel(dbOrder: any, dbItems: any[] = []): Order {
    const paymentRef =
      dbOrder.payment_reference ||
      dbOrder.flutterwave_reference ||
      dbOrder.paystack_reference ||
      null;

    const provider =
      dbOrder.payment_provider ||
      (paymentRef?.startsWith('TBH-FLW') ? 'flutterwave' : dbOrder.paystack_reference ? 'paystack' : 'flutterwave');

    const paymentStatus = this.normalizePaymentStatus(dbOrder.payment_status);
    const orderStatus = dbOrder.order_status || dbOrder.status || (paymentStatus === 'successful' ? 'processing' : 'pending');

    return {
      id: dbOrder.id,
      order_number: dbOrder.order_number,
      secure_token: dbOrder.secure_token || `tok_${Math.random().toString(36).substring(2, 12)}`,
      customer_id: dbOrder.customer_id || null,
      customer_name: dbOrder.customer_name,
      customer_email: dbOrder.customer_email,
      customer_phone: dbOrder.customer_phone,
      delivery_type: (dbOrder.delivery_type as any) || 'shipping',
      shipping_address:
        typeof dbOrder.shipping_address === 'string'
          ? JSON.parse(dbOrder.shipping_address)
          : dbOrder.shipping_address || {},
      subtotal_amount: Number(dbOrder.subtotal ?? dbOrder.subtotal_amount ?? 0),
      delivery_fee: Number(dbOrder.shipping_fee ?? dbOrder.delivery_fee ?? 0),
      discount_amount: Number(dbOrder.discount_amount ?? 0),
      total_amount: Number(dbOrder.total_amount ?? 0),
      currency: dbOrder.currency || 'NGN',
      payment_provider: provider,
      payment_status: paymentStatus,
      order_status: orderStatus as OrderStatus,
      payment_reference: paymentRef,
      flutterwave_reference: dbOrder.flutterwave_reference || paymentRef,
      flutterwave_transaction_id: dbOrder.flutterwave_transaction_id || null,
      flutterwave_authorization_url: dbOrder.flutterwave_authorization_url || null,
      paystack_reference: dbOrder.paystack_reference || null,
      paystack_access_code: dbOrder.paystack_access_code || null,
      paystack_authorization_url: dbOrder.paystack_authorization_url || null,
      payment_channel: dbOrder.payment_channel || null,
      paid_at: dbOrder.paid_at || null,
      abandoned_at: dbOrder.abandoned_at || null,
      refunded_at: dbOrder.refunded_at || null,
      refund_amount: dbOrder.refund_amount ? Number(dbOrder.refund_amount) : null,
      refund_reason: dbOrder.refund_reason || null,
      notes: dbOrder.notes || null,
      items: (dbItems || []).map((it: any) => ({
        id: it.id,
        order_id: it.order_id,
        product_id: it.product_id,
        variant_id: it.variant_id || null,
        product_name: it.product_name,
        sku: it.sku || '',
        unit_price: Number(it.unit_price || 0),
        quantity: Number(it.quantity || 1),
        total_price: Number(it.total_price || (it.unit_price * (it.quantity || 1))),
        image_url: it.image_url || undefined,
      })),
      created_at: dbOrder.created_at,
      updated_at: dbOrder.updated_at || dbOrder.created_at,
    };
  }

  async createOrder(orderData: CreateOrderDTO, orderNumber: string): Promise<Order> {
    const subtotal = orderData.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const total = Math.max(0, subtotal + orderData.deliveryFee - (orderData.discountAmount || 0));
    const provider = orderData.paymentProvider || (orderData.flutterwaveReference ? 'flutterwave' : 'paystack');
    const primaryReference = orderData.paymentReference || orderData.flutterwaveReference || orderData.paystackReference || null;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_number: orderNumber,
      secure_token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      customer_id: orderData.customerId || null,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      delivery_type: orderData.deliveryType,
      shipping_address: orderData.shippingAddress,
      subtotal_amount: subtotal,
      delivery_fee: orderData.deliveryFee,
      discount_amount: orderData.discountAmount || 0,
      total_amount: total,
      currency: 'NGN',
      payment_provider: provider,
      payment_status: 'pending',
      order_status: 'pending',
      payment_reference: primaryReference,
      flutterwave_reference: orderData.flutterwaveReference || primaryReference,
      flutterwave_authorization_url: orderData.flutterwaveAuthorizationUrl || null,
      paystack_reference: orderData.paystackReference || (provider === 'paystack' ? primaryReference : null),
      paystack_access_code: orderData.paystackAccessCode || null,
      paystack_authorization_url: orderData.paystackAuthorizationUrl || null,
      notes: orderData.notes,
      items: orderData.items.map((it, idx) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${idx}_${Date.now()}`,
        product_id: it.productId,
        variant_id: it.variantId,
        product_name: it.productName,
        sku: it.sku,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        total_price: it.unitPrice * it.quantity,
        image_url: it.imageUrl,
      })),
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 1. Cache in memory
    this.ordersStore.set(newOrder.id, newOrder);
    this.ordersStore.set(orderNumber, newOrder);
    if (primaryReference) {
      this.ordersStore.set(primaryReference, newOrder);
    }

    // 2. Resilient Persistence to Supabase
    try {
      // Validate customer_id to prevent foreign key constraint violations
      let validCustomerId: string | null = null;
      if (newOrder.customer_id) {
        try {
          const { data: custData } = await supabaseAdmin
            .from('customers')
            .select('id')
            .or(`id.eq.${newOrder.customer_id},email.eq.${newOrder.customer_email}`)
            .maybeSingle();
          if (custData) {
            validCustomerId = custData.id;
          }
        } catch (e) {}
      } else if (newOrder.customer_email) {
        try {
          const { data: custData } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('email', newOrder.customer_email)
            .maybeSingle();
          if (custData) {
            validCustomerId = custData.id;
          }
        } catch (e) {}
      }

      const formattedShippingAddress = typeof newOrder.shipping_address === 'string'
        ? newOrder.shipping_address
        : JSON.stringify(newOrder.shipping_address || {});

      const dbPayload: any = {
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_id: validCustomerId,
        customer_name: newOrder.customer_name,
        customer_email: newOrder.customer_email,
        customer_phone: newOrder.customer_phone,
        shipping_address: formattedShippingAddress,
        subtotal: newOrder.subtotal_amount,
        shipping_fee: newOrder.delivery_fee,
        discount_amount: newOrder.discount_amount,
        total_amount: newOrder.total_amount,
        currency: newOrder.currency,
        status: 'pending',
        order_status: 'pending',
        payment_status: 'unpaid',
        payment_method: provider,
        payment_provider: provider,
        payment_reference: primaryReference,
        flutterwave_reference: newOrder.flutterwave_reference || primaryReference,
        flutterwave_authorization_url: newOrder.flutterwave_authorization_url,
        paystack_reference: newOrder.paystack_reference || primaryReference,
        paystack_access_code: newOrder.paystack_access_code,
        paystack_authorization_url: newOrder.paystack_authorization_url,
        notes: newOrder.notes,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      };

      let { error: orderError } = await supabaseAdmin.from('orders').insert(dbPayload);

      // Fallback if any missing fields caused insert failure
      if (orderError) {
        console.warn('[SupabaseOrderRepository] Primary insert error:', orderError);
        const fallbackPayload: any = {
          id: newOrder.id,
          order_number: newOrder.order_number,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email,
          customer_phone: newOrder.customer_phone,
          shipping_address: formattedShippingAddress,
          subtotal: newOrder.subtotal_amount,
          shipping_fee: newOrder.delivery_fee,
          total_amount: newOrder.total_amount,
          payment_status: 'unpaid',
          order_status: 'pending',
          paystack_reference: primaryReference,
          created_at: newOrder.created_at,
          updated_at: newOrder.updated_at,
        };
        const { error: fbErr } = await supabaseAdmin.from('orders').insert(fallbackPayload);
        if (!fbErr) orderError = null;
      }

      // Insert order items
      if (!orderError && newOrder.items.length > 0) {
        const orderItemsPayload = newOrder.items.map(it => ({
          id: it.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}`),
          order_id: newOrder.id,
          product_id: it.product_id,
          product_name: it.product_name,
          sku: it.sku || '',
          unit_price: it.unit_price,
          quantity: it.quantity,
          total_price: it.total_price,
          image_url: it.image_url || null,
          created_at: newOrder.created_at,
        }));

        await supabaseAdmin.from('order_items').insert(orderItemsPayload);
      }

      // Record initial pending payment attempt
      if (primaryReference) {
        const initialPayment: PaymentRecord = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay_${Date.now()}`,
          order_id: newOrder.id,
          customer_id: newOrder.customer_id,
          reference: primaryReference,
          amount: newOrder.total_amount,
          currency: newOrder.currency,
          status: 'pending',
          gateway: provider,
          created_at: nowIso,
          updated_at: nowIso,
        };
        await this.savePayment(initialPayment);
      }
    } catch (dbErr) {
      console.warn('[SupabaseOrderRepository] Error inserting order to Supabase:', dbErr);
    }

    return newOrder;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const memoryOrder = this.ordersStore.get(id);
    if (memoryOrder) return memoryOrder;

    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const order = this.mapDbOrderToModel(data, data.order_items);
        this.ordersStore.set(order.id, order);
        this.ordersStore.set(order.order_number, order);
        return order;
      }
    } catch (err) {
      console.warn('[SupabaseOrderRepository] Error fetching order by ID:', err);
    }

    return null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const memoryOrder = this.ordersStore.get(orderNumber);
    if (memoryOrder) return memoryOrder;

    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (!error && data) {
        const order = this.mapDbOrderToModel(data, data.order_items);
        this.ordersStore.set(order.id, order);
        this.ordersStore.set(order.order_number, order);
        return order;
      }
    } catch (err) {
      console.warn('[SupabaseOrderRepository] Error fetching order by number:', err);
    }

    return null;
  }

  async getOrderByReference(reference: string): Promise<Order | null> {
    const cleanRef = reference.trim();
    const found = this.ordersStore.get(cleanRef);
    if (found) return found;

    for (const order of this.ordersStore.values()) {
      if (
        order.payment_reference === cleanRef ||
        order.flutterwave_reference === cleanRef ||
        order.paystack_reference === cleanRef ||
        order.order_number === cleanRef
      ) {
        return order;
      }
    }

    try {
      let { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .or(
          `paystack_reference.eq.${cleanRef},order_number.eq.${cleanRef},payment_reference.eq.${cleanRef},flutterwave_reference.eq.${cleanRef}`
        )
        .maybeSingle();

      if (error) {
        const fallback = await supabaseAdmin
          .from('orders')
          .select('*, order_items(*)')
          .or(`paystack_reference.eq.${cleanRef},order_number.eq.${cleanRef}`)
          .maybeSingle();
        data = fallback.data;
      }

      if (data) {
        const order = this.mapDbOrderToModel(data, data.order_items);
        this.ordersStore.set(order.id, order);
        this.ordersStore.set(order.order_number, order);
        this.ordersStore.set(cleanRef, order);
        return order;
      }
    } catch (err) {
      console.warn('[SupabaseOrderRepository] Error fetching order by reference:', err);
    }

    return null;
  }

  async getOrderByPaystackReference(reference: string): Promise<Order | null> {
    return this.getOrderByReference(reference);
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    reference?: string,
    channel?: string,
    paidAt?: string,
    paymentProvider?: string,
    transactionId?: string
  ): Promise<Order> {
    let order = await this.getOrderById(orderId);
    if (!order) {
      order = await this.getOrderByNumber(orderId);
    }
    if (!order && reference) {
      order = await this.getOrderByReference(reference);
    }
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const normalizedStatus = this.normalizePaymentStatus(status);
    const nowIso = new Date().toISOString();

    order.payment_status = normalizedStatus;
    if (normalizedStatus === 'successful') {
      order.order_status = 'processing';
      order.paid_at = paidAt || nowIso;
    } else if (normalizedStatus === 'failed') {
      order.order_status = 'payment_failed';
    } else if (normalizedStatus === 'abandoned') {
      order.order_status = 'abandoned';
      order.abandoned_at = nowIso;
    } else if (normalizedStatus === 'cancelled') {
      order.order_status = 'cancelled';
    } else if (normalizedStatus === 'refunded') {
      order.order_status = 'refunded';
      order.refunded_at = nowIso;
    }

    if (reference) {
      order.payment_reference = reference;
      order.flutterwave_reference = reference;
      order.paystack_reference = reference;
      this.ordersStore.set(reference, order);
    }

    if (paymentProvider) {
      order.payment_provider = paymentProvider;
    }
    if (channel) {
      order.payment_channel = channel;
    }
    if (transactionId) {
      order.flutterwave_transaction_id = transactionId;
    }

    order.updated_at = nowIso;
    this.ordersStore.set(order.id, order);
    this.ordersStore.set(order.order_number, order);

    try {
      const dbPaymentStatus =
        normalizedStatus === 'successful'
          ? 'paid'
          : normalizedStatus === 'failed'
          ? 'failed'
          : normalizedStatus;

      const dbOrderStatus = order.order_status;

      const updatePayload: Record<string, any> = {
        payment_status: dbPaymentStatus,
        status: dbOrderStatus,
        order_status: dbOrderStatus,
        paystack_reference: order.payment_reference || reference,
        payment_reference: order.payment_reference || reference,
        flutterwave_reference: order.flutterwave_reference || reference,
        payment_provider: order.payment_provider || paymentProvider,
        payment_channel: order.payment_channel || channel,
        paid_at: order.paid_at,
        abandoned_at: order.abandoned_at,
        refunded_at: order.refunded_at,
        flutterwave_transaction_id: order.flutterwave_transaction_id || transactionId,
        updated_at: order.updated_at,
      };

      let { error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (updateError && order.order_number) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('order_number', order.order_number);
      }
    } catch (dbErr) {
      console.warn('[SupabaseOrderRepository] Error updating payment status in Supabase:', dbErr);
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    let order = await this.getOrderById(orderId);
    if (!order) {
      order = await this.getOrderByNumber(orderId);
    }
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    order.order_status = status;
    if (status === 'paid' || status === 'processing') {
      order.payment_status = 'successful';
      order.paid_at = order.paid_at || new Date().toISOString();
    }
    order.updated_at = new Date().toISOString();

    this.ordersStore.set(order.id, order);
    this.ordersStore.set(order.order_number, order);

    try {
      const allowedDbStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'abandoned', 'refunded'];
      const dbStatus = allowedDbStatuses.includes(status) ? status : 'pending';

      const updateData: Record<string, any> = {
        status: dbStatus,
        order_status: dbStatus,
        updated_at: order.updated_at,
      };

      if (status === 'paid' || status === 'processing') {
        updateData.payment_status = 'paid';
        if (order.paid_at) updateData.paid_at = order.paid_at;
      }

      let { error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError && order.order_number) {
        await supabaseAdmin
          .from('orders')
          .update(updateData)
          .eq('order_number', order.order_number);
      }
    } catch (dbErr) {
      console.warn('[SupabaseOrderRepository] Error updating order status in Supabase:', dbErr);
    }

    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    const ordersMap = new Map<string, Order>();

    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((row: any) => {
          const model = this.mapDbOrderToModel(row, row.order_items);
          ordersMap.set(model.id, model);
          this.ordersStore.set(model.id, model);
          this.ordersStore.set(model.order_number, model);
        });
      }
    } catch (err) {
      console.warn('[SupabaseOrderRepository] Error fetching all orders from Supabase:', err);
    }

    for (const order of this.ordersStore.values()) {
      if (!ordersMap.has(order.id)) {
        ordersMap.set(order.id, order);
      }
    }

    return Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async savePayment(payment: PaymentRecord): Promise<PaymentRecord> {
    this.paymentsStore.set(payment.reference, payment);
    try {
      await supabaseAdmin.from('payments').upsert(
        {
          id: payment.id,
          order_id: payment.order_id,
          customer_id: payment.customer_id,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          gateway: payment.gateway,
          gateway_reference: payment.gateway_reference,
          gateway_response: payment.gateway_response,
          channel: payment.channel,
          paid_at: payment.paid_at,
          abandoned_at: payment.abandoned_at,
          refunded_at: payment.refunded_at,
          refund_amount: payment.refund_amount,
          refund_reason: payment.refund_reason,
          metadata: payment.metadata || {},
          created_at: payment.created_at,
          updated_at: payment.updated_at,
        },
        { onConflict: 'reference' }
      );
    } catch (e) {
      console.warn('[SupabaseOrderRepository] Error persisting payment record:', e);
    }
    return payment;
  }

  async getPaymentByReference(reference: string): Promise<PaymentRecord | null> {
    const found = this.paymentsStore.get(reference);
    if (found) return found;

    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('reference', reference)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          order_id: data.order_id,
          customer_id: data.customer_id || null,
          reference: data.reference,
          amount: Number(data.amount),
          currency: data.currency,
          status: data.status,
          gateway: data.gateway,
          gateway_reference: data.gateway_reference,
          gateway_response: data.gateway_response,
          channel: data.channel,
          paid_at: data.paid_at,
          abandoned_at: data.abandoned_at,
          refunded_at: data.refunded_at,
          refund_amount: data.refund_amount ? Number(data.refund_amount) : null,
          refund_reason: data.refund_reason,
          metadata: data.metadata || {},
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (e) {}

    return null;
  }

  async getPayments(): Promise<PaymentRecord[]> {
    const paymentsMap = new Map<string, PaymentRecord>();

    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((p: any) => {
          const rec: PaymentRecord = {
            id: p.id,
            order_id: p.order_id,
            customer_id: p.customer_id || null,
            reference: p.reference,
            amount: Number(p.amount),
            currency: p.currency,
            status: p.status,
            gateway: p.gateway,
            gateway_reference: p.gateway_reference,
            gateway_response: p.gateway_response,
            channel: p.channel,
            paid_at: p.paid_at,
            abandoned_at: p.abandoned_at,
            refunded_at: p.refunded_at,
            refund_amount: p.refund_amount ? Number(p.refund_amount) : null,
            refund_reason: p.refund_reason,
            metadata: p.metadata || {},
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
          paymentsMap.set(rec.reference, rec);
        });
      }
    } catch (e) {}

    for (const p of this.paymentsStore.values()) {
      if (!paymentsMap.has(p.reference)) {
        paymentsMap.set(p.reference, p);
      }
    }

    return Array.from(paymentsMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getPaymentsByOrderId(orderId: string): Promise<PaymentRecord[]> {
    const all = await this.getPayments();
    return all.filter(p => p.order_id === orderId);
  }

  async markAbandonedOrders(minutesOld: number = 30): Promise<{ count: number; orderIds: string[] }> {
    const cutoffDate = new Date(Date.now() - minutesOld * 60 * 1000).toISOString();
    const abandonedIds: string[] = [];

    try {
      // 1. First try calling the safe PostgreSQL stored procedure
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('process_abandoned_orders', {
        p_interval_minutes: minutesOld,
      });

      if (!rpcError && rpcData !== null) {
        const count = typeof rpcData === 'number' ? rpcData : rpcData?.[0]?.abandoned_count || 0;
        return { count, orderIds: [] };
      }
    } catch (e) {}

    // 2. Fallback direct query sweep
    try {
      const { data: eligibleOrders, error } = await supabaseAdmin
        .from('orders')
        .select('id, payment_reference')
        .in('payment_status', ['pending', 'payment_pending', 'unpaid'])
        .lt('created_at', cutoffDate);

      if (!error && eligibleOrders && eligibleOrders.length > 0) {
        const nowIso = new Date().toISOString();
        const ids = eligibleOrders.map(o => o.id);

        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'abandoned',
            status: 'abandoned',
            order_status: 'abandoned',
            abandoned_at: nowIso,
            updated_at: nowIso,
          })
          .in('id', ids);

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'abandoned',
            abandoned_at: nowIso,
            updated_at: nowIso,
          })
          .in('order_id', ids)
          .in('status', ['pending', 'payment_pending', 'unpaid']);

        // Update in-memory stores
        for (const o of eligibleOrders) {
          abandonedIds.push(o.id);
          const memOrder = this.ordersStore.get(o.id);
          if (memOrder) {
            memOrder.payment_status = 'abandoned';
            memOrder.order_status = 'abandoned';
            memOrder.abandoned_at = nowIso;
          }
        }
      }
    } catch (err) {
      console.error('[SupabaseOrderRepository] Error sweeping abandoned orders:', err);
    }

    return { count: abandonedIds.length, orderIds: abandonedIds };
  }

  async recordRefund(orderId: string, refundAmount: number, reason?: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    const nowIso = new Date().toISOString();
    order.payment_status = 'refunded';
    order.order_status = 'refunded';
    order.refunded_at = nowIso;
    order.refund_amount = refundAmount;
    order.refund_reason = reason || 'Customer requested refund';
    order.updated_at = nowIso;

    this.ordersStore.set(order.id, order);
    this.ordersStore.set(order.order_number, order);

    try {
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'refunded',
          status: 'refunded',
          order_status: 'refunded',
          refunded_at: nowIso,
          refund_amount: refundAmount,
          refund_reason: order.refund_reason,
          updated_at: nowIso,
        })
        .eq('id', order.id);

      await supabaseAdmin
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: nowIso,
          refund_amount: refundAmount,
          refund_reason: order.refund_reason,
          updated_at: nowIso,
        })
        .eq('order_id', order.id);
    } catch (e) {
      console.error('[SupabaseOrderRepository] Error recording refund:', e);
    }

    return order;
  }
}
