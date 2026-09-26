export type PaymentStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'payment_failed'
  | 'refunded'
  | 'cancelled';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'refunded';

export type DeliveryType = 'shipping' | 'pickup';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  lga: string;
  state: string;
  country: string;
  postalCode?: string;
  deliveryInstructions?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  sku?: string;
  product_slug?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  secure_token?: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  shipping_address: ShippingAddress;
  subtotal_amount: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  paystack_reference?: string | null;
  paystack_access_code?: string | null;
  paystack_authorization_url?: string | null;
  payment_channel?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  gateway: string;
  gateway_response?: string | null;
  channel?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderDTO {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  shippingAddress: ShippingAddress;
  items: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
    sku?: string;
  }>;
  deliveryFee: number;
  discountAmount?: number;
  notes?: string;
  paystackReference?: string;
  paystackAccessCode?: string;
  paystackAuthorizationUrl?: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  productSlug: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  categoryName?: string;
  maxStock: number;
}

// Paystack API Types
export interface PaystackInitializePayload {
  email: string;
  amount: number; // in kobo
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number; // in kobo
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
    };
    authorization?: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bin: string;
      bank: string;
      channel: string;
      signature: string;
      reusable: boolean;
      country_code: string;
      account_name: string | null;
    };
  };
}

export interface PaystackWebhookEvent {
  event: 'charge.success' | 'charge.failed' | string;
  data: PaystackVerifyResponse['data'];
}
