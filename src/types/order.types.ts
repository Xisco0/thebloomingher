export type PaymentStatus =
  | 'pending'
  | 'payment_pending'
  | 'successful'
  | 'paid'
  | 'failed'
  | 'payment_failed'
  | 'abandoned'
  | 'cancelled'
  | 'refunded';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'abandoned'
  | 'refunded';

export type DeliveryType = 'shipping' | 'pickup';

export type PaymentProvider = 'flutterwave' | 'paystack' | 'bank_transfer';

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

export type RefundStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'REFUNDED'
  | 'FAILED'
  | 'REJECTED';

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
  payment_provider?: PaymentProvider | string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_reference?: string | null;
  flutterwave_reference?: string | null;
  flutterwave_transaction_id?: string | null;
  flutterwave_authorization_url?: string | null;
  paystack_reference?: string | null;
  paystack_access_code?: string | null;
  paystack_authorization_url?: string | null;
  payment_channel?: string | null;
  paid_at?: string | null;
  abandoned_at?: string | null;
  refunded_at?: string | null;
  refund_amount?: number | null;
  refund_reason?: string | null;

  // Overpayment & Refund Review Fields
  amount_paid?: number | null;
  overpayment_amount?: number | null;
  refund_amount_requested?: number | null;
  refund_amount_completed?: number | null;
  refund_status?: RefundStatus | null;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;

  notes?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  customer_id?: string | null;
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'paid' | 'failed' | 'abandoned' | 'cancelled' | 'refunded';
  gateway: 'flutterwave' | 'paystack' | 'bank_transfer' | string;
  gateway_reference?: string | null;
  gateway_response?: string | null;
  channel?: string | null;
  paid_at?: string | null;
  abandoned_at?: string | null;
  refunded_at?: string | null;
  refund_amount?: number | null;
  refund_reason?: string | null;

  // Overpayment & Refund Review Fields
  amount_paid?: number | null;
  overpayment_amount?: number | null;
  refund_amount_requested?: number | null;
  refund_amount_completed?: number | null;
  refund_status?: RefundStatus | null;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;

  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderDTO {
  customerId?: string | null;
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
  paymentProvider?: PaymentProvider;
  paymentReference?: string;
  flutterwaveReference?: string;
  flutterwaveAuthorizationUrl?: string;
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

// Flutterwave API Types
export interface FlutterwaveInitializePayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
  payment_options?: string;
}

export interface FlutterwaveInitializeResponse {
  status: 'success' | 'error' | string;
  message: string;
  data?: {
    link: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: 'success' | 'error' | string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint?: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee?: number;
    merchant_fee?: number;
    processor_response: string;
    auth_model?: string;
    ip?: string;
    narration?: string;
    status: 'successful' | 'failed' | 'pending' | string;
    payment_type: string;
    created_at: string;
    account_id?: number;
    customer: {
      id?: number;
      name: string;
      phone_number?: string;
      email: string;
      created_at?: string;
    };
    card?: {
      first_6digits?: string;
      last_4digits?: string;
      issuer?: string;
      country?: string;
      type?: string;
      expiry?: string;
    };
    meta?: Record<string, any>;
  };
}

export interface FlutterwaveWebhookEvent {
  event?: string;
  'event.type'?: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: 'successful' | 'failed' | 'pending' | string;
    payment_type?: string;
    created_at?: string;
    customer?: {
      id?: number;
      name?: string;
      phone_number?: string;
      email?: string;
    };
    [key: string]: any;
  };
}

// Paystack API Types (Legacy / Fallback support)
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
  };
}

export interface PaystackWebhookEvent {
  event: 'charge.success' | 'charge.failed' | string;
  data: PaystackVerifyResponse['data'];
}
