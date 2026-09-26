import { IOrderRepository } from '../interfaces';
import { Order, CreateOrderDTO, PaymentStatus, OrderStatus, PaymentRecord } from '@/types';

export class SupabaseOrderRepository implements IOrderRepository {
  private ordersStore: Map<string, Order> = new Map();
  private paymentsStore: Map<string, PaymentRecord> = new Map();

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

    this.ordersStore.set(newOrder.id, newOrder);
    this.ordersStore.set(orderNumber, newOrder);
    if (newOrder.paystack_reference) {
      this.ordersStore.set(newOrder.paystack_reference, newOrder);
    }
    return newOrder;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.ordersStore.get(id) || null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.ordersStore.get(orderNumber) || null;
  }

  async getOrderByPaystackReference(reference: string): Promise<Order | null> {
    const found = this.ordersStore.get(reference);
    if (found) return found;

    for (const order of this.ordersStore.values()) {
      if (order.paystack_reference === reference) {
        return order;
      }
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
    const order = this.ordersStore.get(orderId);
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
    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = this.ordersStore.get(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    order.order_status = status;
    order.updated_at = new Date().toISOString();

    this.ordersStore.set(order.id, order);
    this.ordersStore.set(order.order_number, order);
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    // Return unique orders sorted by created_at DESC
    const uniqueOrders = new Map<string, Order>();
    for (const order of this.ordersStore.values()) {
      uniqueOrders.set(order.id, order);
    }
    return Array.from(uniqueOrders.values()).sort(
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
