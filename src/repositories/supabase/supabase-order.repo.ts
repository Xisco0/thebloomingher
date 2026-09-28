import { IOrderRepository } from '../interfaces';
import { Order, CreateOrderDTO, PaymentStatus, OrderStatus, PaymentRecord, OrderItem } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabaseOrderRepository implements IOrderRepository {
  private ordersStore: Map<string, Order> = new Map();
  private paymentsStore: Map<string, PaymentRecord> = new Map();

  private mapDbOrderToModel(dbOrder: any, dbItems: any[] = []): Order {
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
      payment_status: dbOrder.payment_status === 'unpaid' ? 'payment_pending' : dbOrder.payment_status,
      order_status: dbOrder.status || dbOrder.order_status || 'pending',
      paystack_reference: dbOrder.paystack_reference || null,
      paystack_access_code: dbOrder.paystack_access_code || null,
      paystack_authorization_url: dbOrder.paystack_authorization_url || null,
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

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_number: orderNumber,
      secure_token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
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
      payment_status: 'payment_pending',
      order_status: 'pending',
      paystack_reference: orderData.paystackReference || null,
      paystack_access_code: orderData.paystackAccessCode || null,
      paystack_authorization_url: orderData.paystackAuthorizationUrl || null,
      notes: orderData.notes,
      items: orderData.items.map((it, idx) => ({
        id: `item_${idx}_${Date.now()}`,
        product_id: it.productId,
        variant_id: it.variantId,
        product_name: it.productName,
        sku: it.sku,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        total_price: it.unitPrice * it.quantity,
        image_url: it.imageUrl,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Cache in memory
    this.ordersStore.set(newOrder.id, newOrder);
    this.ordersStore.set(orderNumber, newOrder);
    if (newOrder.paystack_reference) {
      this.ordersStore.set(newOrder.paystack_reference, newOrder);
    }

    // 2. Persist to Supabase
    try {
      const { error: orderError } = await supabaseAdmin.from('orders').insert({
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        customer_email: newOrder.customer_email,
        customer_phone: newOrder.customer_phone,
        subtotal: newOrder.subtotal_amount,
        discount_amount: newOrder.discount_amount,
        shipping_fee: newOrder.delivery_fee,
        total_amount: newOrder.total_amount,
        currency: newOrder.currency,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'paystack',
        paystack_reference: newOrder.paystack_reference,
        shipping_address: newOrder.shipping_address,
        notes: newOrder.notes,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      });

      if (!orderError && newOrder.items.length > 0) {
        const orderItemsPayload = newOrder.items.map(it => ({
          id: it.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

  async getOrderByPaystackReference(reference: string): Promise<Order | null> {
    const found = this.ordersStore.get(reference);
    if (found) return found;

    for (const order of this.ordersStore.values()) {
      if (order.paystack_reference === reference) {
        return order;
      }
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (!error && data) {
        const order = this.mapDbOrderToModel(data, data.order_items);
        this.ordersStore.set(order.id, order);
        this.ordersStore.set(order.order_number, order);
        if (reference) this.ordersStore.set(reference, order);
        return order;
      }
    } catch (err) {
      console.warn('[SupabaseOrderRepository] Error fetching order by reference:', err);
    }

    return null;
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    reference?: string,
    channel?: string,
    paidAt?: string
  ): Promise<Order> {
    let order = await this.getOrderById(orderId);
    if (!order) {
      order = await this.getOrderByNumber(orderId);
    }
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    order.payment_status = status;
    if (status === 'paid') {
      order.order_status = 'processing';
      order.paid_at = paidAt || new Date().toISOString();
    } else if (status === 'payment_failed') {
      order.order_status = 'payment_failed';
    }

    if (reference) {
      order.paystack_reference = reference;
      this.ordersStore.set(reference, order);
    }
    if (channel) {
      order.payment_channel = channel;
    }

    order.updated_at = new Date().toISOString();

    this.ordersStore.set(order.id, order);
    this.ordersStore.set(order.order_number, order);

    try {
      const dbPaymentStatus = status === 'payment_pending' ? 'unpaid' : status === 'paid' ? 'paid' : status === 'payment_failed' ? 'failed' : 'unpaid';
      const dbOrderStatus = status === 'paid' ? 'processing' : 'pending';

      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: dbPaymentStatus,
          status: dbOrderStatus,
          paystack_reference: order.paystack_reference,
          updated_at: order.updated_at,
        })
        .eq('id', order.id);
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
    order.updated_at = new Date().toISOString();

    this.ordersStore.set(order.id, order);
    this.ordersStore.set(order.order_number, order);

    try {
      const allowedDbStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      const dbStatus = allowedDbStatuses.includes(status) ? status : 'pending';

      await supabaseAdmin
        .from('orders')
        .update({
          status: dbStatus,
          updated_at: order.updated_at,
        })
        .eq('id', order.id);
    } catch (dbErr) {
      console.warn('[SupabaseOrderRepository] Error updating order status in Supabase:', dbErr);
    }

    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    const ordersMap = new Map<string, Order>();

    // 1. Fetch from Supabase
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

    // 2. Merge memory store
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
    return payment;
  }

  async getPaymentByReference(reference: string): Promise<PaymentRecord | null> {
    return this.paymentsStore.get(reference) || null;
  }
}

