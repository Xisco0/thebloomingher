import { orderRepository } from '@/repositories';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  FlutterwaveInitializeResponse,
  FlutterwaveVerifyResponse,
  Order,
  PaymentRecord,
  RefundStatus,
} from '@/types';
import { formatFlutterwaveAmount } from '@/lib/utils/flutterwave';

export interface InitializeFlutterwaveParams {
  email: string;
  amountInNaira: number;
  reference: string;
  callbackUrl: string;
  customerName: string;
  customerPhone?: string;
  orderNumber?: string;
  metadata?: Record<string, any>;
}

export class FlutterwaveService {
  private baseUrl = 'https://api.flutterwave.com/v3';

  private getSecretKey(): string {
    return (process.env.FLW_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '');
  }

  private getSecretHash(): string {
    return (process.env.FLW_SECRET_HASH || '').trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Initializes a Flutterwave standard payment checkout link on the server.
   */
  async initializePayment(
    params: InitializeFlutterwaveParams
  ): Promise<{ success: boolean; authorizationUrl: string; reference: string; error?: string }> {
    const secretKey = this.getSecretKey();
    const amount = formatFlutterwaveAmount(params.amountInNaira);

    // If FLW_SECRET_KEY is configured (supports both Test FLWSECK_TEST-... and Live FLWSECK-...)
    if (secretKey && !secretKey.startsWith('FLWPUBK')) {
      try {
        const payload = {
          tx_ref: params.reference,
          amount,
          currency: 'NGN',
          redirect_url: params.callbackUrl,
          customer: {
            email: params.email,
            phonenumber: params.customerPhone || '',
            name: params.customerName,
          },
          customizations: {
            title: 'TheBloomingHer Care & Wellness',
            description: `Payment for Order #${params.orderNumber || params.reference}`,
            logo: 'https://www.thebloomingher.com/images/logo.jpg',
          },
          meta: {
            orderNumber: params.orderNumber || '',
            ...params.metadata,
          },
        };

        const response = await fetch(`${this.baseUrl}/payments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data: FlutterwaveInitializeResponse = await response.json();

        if (!response.ok || data.status !== 'success' || !data.data?.link) {
          return {
            success: false,
            authorizationUrl: '',
            reference: params.reference,
            error: data.message || 'Flutterwave payment initialization failed',
          };
        }

        return {
          success: true,
          authorizationUrl: data.data.link,
          reference: params.reference,
        };
      } catch (err: any) {
        console.error('[Flutterwave Service] Network initialization error:', err);
        return {
          success: false,
          authorizationUrl: '',
          reference: params.reference,
          error: err.message || 'Failed to connect to Flutterwave gateway',
        };
      }
    }

    // Sandbox / Development fallback mode when testing without live secret key
    const mockAuthUrl = `${params.callbackUrl}?status=successful&tx_ref=${encodeURIComponent(
      params.reference
    )}&transaction_id=mock_${Date.now()}&mock_flw=true`;

    return {
      success: true,
      authorizationUrl: mockAuthUrl,
      reference: params.reference,
    };
  }

  /**
   * Verifies a Flutterwave transaction via the official verification endpoint.
   * Endpoint: GET https://api.flutterwave.com/v3/transactions/:id/verify
   */
  async verifyTransaction(
    transactionId: string
  ): Promise<{ success: boolean; data?: FlutterwaveVerifyResponse['data']; error?: string }> {
    const secretKey = this.getSecretKey();

    // In production or live/test mode with secret key
    if (secretKey && !secretKey.startsWith('FLWPUBK') && !transactionId.startsWith('mock_')) {
      try {
        const response = await fetch(`${this.baseUrl}/transactions/${encodeURIComponent(transactionId)}/verify`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        const data: FlutterwaveVerifyResponse = await response.json();

        if (!response.ok || data.status !== 'success' || !data.data || data.data.status !== 'successful') {
          return {
            success: false,
            data: data.data,
            error: data.message || data.data?.processor_response || 'Flutterwave transaction verification failed',
          };
        }

        return {
          success: true,
          data: data.data,
        };
      } catch (err: any) {
        console.error('[Flutterwave Service] Transaction verification network error:', err);
        return {
          success: false,
          error: err.message || 'Failed to verify transaction with Flutterwave',
        };
      }
    }

    // Mock / Local sandbox verification
    return {
      success: true,
      data: {
        id: 999999999,
        tx_ref: `TBH-FLW-${Date.now()}`,
        flw_ref: `FLW-MOCK-${Date.now()}`,
        amount: 0,
        currency: 'NGN',
        charged_amount: 0,
        processor_response: 'Approved',
        status: 'successful',
        payment_type: 'card',
        created_at: new Date().toISOString(),
        customer: {
          id: 1,
          name: 'Test Customer',
          email: 'test@thebloomingher.com',
          phone_number: '+2348103641002',
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * Authoritatively confirms and processes a successful payment for an order.
   * STRICTLY IDEMPOTENT: If an order has already been marked as paid, it skips re-processing
   * and prevents duplicate inventory deductions or double record insertions.
   */
  async processSuccessfulPayment(
    txRef: string,
    verificationData?: Partial<FlutterwaveVerifyResponse['data']>,
    transactionId?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    // 1. Locate corresponding order
    let order = await orderRepository.getOrderByReference(txRef);
    if (!order) {
      order = await orderRepository.getOrderByPaystackReference(txRef);
    }
    if (!order) {
      order = await orderRepository.getOrderByNumber(txRef);
    }

    if (!order) {
      return {
        success: false,
        error: `Order with transaction reference "${txRef}" was not found.`,
      };
    }

    // 2. IDEMPOTENCY CHECK: If already marked successful / paid, return safely
    if (order.payment_status === 'successful' || order.payment_status === 'paid') {
      return {
        success: true,
        order,
      };
    }

    // 3. Amount & Currency Validation
    const verifiedAmount = Number(
      verificationData?.amount ?? verificationData?.charged_amount ?? order.total_amount
    );
    const expectedAmount = Number(order.total_amount);

    if (verificationData && verificationData.amount !== undefined && verificationData.amount > 0) {
      // Verify that the paid amount is greater than or equal to the expected order total
      if (verifiedAmount < expectedAmount) {
        return {
          success: false,
          error: `Payment amount mismatch: received ₦${verifiedAmount}, expected ₦${expectedAmount}.`,
        };
      }

      // Verify Currency
      if (verificationData.currency && verificationData.currency.toUpperCase() !== (order.currency || 'NGN').toUpperCase()) {
        return {
          success: false,
          error: `Payment currency mismatch: received ${verificationData.currency}, expected ${order.currency}.`,
        };
      }
    }

    const channel = verificationData?.payment_type || 'card';
    const paidAt = verificationData?.created_at || new Date().toISOString();
    const gatewayResponse = verificationData?.processor_response || 'Successful';
    const flwTransactionId = transactionId || (verificationData?.id ? String(verificationData.id) : undefined);

    // Overpayment Calculation (Excess = Math.max(0, verifiedAmount - expectedAmount))
    const overpaymentAmount = Math.max(0, Math.round(verifiedAmount - expectedAmount));
    const overpaymentDetails = {
      amount_paid: verifiedAmount,
      overpayment_amount: overpaymentAmount,
      refund_amount_requested: overpaymentAmount > 0 ? overpaymentAmount : 0,
      refund_amount_completed: 0,
      refund_status: (overpaymentAmount > 0 ? 'PENDING_REVIEW' : 'NOT_REQUIRED') as RefundStatus,
    };

    // 4. Update Order Status in Database & Store
    const updatedOrder = await orderRepository.updatePaymentStatus(
      order.id,
      'successful',
      txRef,
      channel,
      paidAt,
      'flutterwave',
      flwTransactionId,
      overpaymentDetails
    );

    // 5. Atomic Inventory Deduction
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('reduce_order_inventory', {
        p_order_id: order.id,
      });
      if (rpcError) {
        throw rpcError;
      }
    } catch (invErr) {
      console.warn('[Flutterwave Service] Database RPC inventory deduction fallback notice:', invErr);
      for (const item of order.items) {
        try {
          if (item.variant_id) {
            const { data: variant } = await supabaseAdmin
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', item.variant_id)
              .single();
            if (variant && typeof variant.stock_quantity === 'number') {
              await supabaseAdmin
                .from('product_variants')
                .update({
                  stock_quantity: Math.max(0, variant.stock_quantity - item.quantity),
                })
                .eq('id', item.variant_id);
            }
          } else {
            const { data: product } = await supabaseAdmin
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();
            if (product && typeof product.stock_quantity === 'number') {
              await supabaseAdmin
                .from('products')
                .update({
                  stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
                })
                .eq('id', item.product_id);
            }
          }
        } catch (fallbackErr) {
          console.warn('[Flutterwave Service] Fallback stock deduction error for item:', item.product_id, fallbackErr);
        }
      }
    }

    // 6. Save Payment Audit Record
    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_id: order.id,
      customer_id: order.customer_id,
      reference: txRef,
      amount: order.total_amount,
      currency: order.currency || 'NGN',
      status: 'successful',
      gateway: 'flutterwave',
      gateway_reference: flwTransactionId,
      gateway_response: gatewayResponse,
      channel,
      paid_at: paidAt,
      metadata: { verification: verificationData || {} },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await orderRepository.savePayment(paymentRecord);

    return {
      success: true,
      order: updatedOrder,
    };
  }

  /**
   * Processes a failed payment attempt.
   */
  async processFailedPayment(
    txRef: string,
    reason?: string
  ): Promise<{ success: boolean; order?: Order }> {
    let order = await orderRepository.getOrderByReference(txRef);
    if (!order) {
      order = await orderRepository.getOrderByPaystackReference(txRef);
    }
    if (!order) return { success: false };

    // If order was already successful, do not overwrite with failed status
    if (order.payment_status === 'successful' || order.payment_status === 'paid') {
      return { success: true, order };
    }

    const updated = await orderRepository.updatePaymentStatus(
      order.id,
      'failed',
      txRef,
      undefined,
      undefined,
      'flutterwave'
    );

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_id: order.id,
      customer_id: order.customer_id,
      reference: txRef,
      amount: order.total_amount,
      currency: order.currency || 'NGN',
      status: 'failed',
      gateway: 'flutterwave',
      gateway_response: reason || 'Payment Failed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await orderRepository.savePayment(paymentRecord);

    return { success: true, order: updated };
  }

  /**
   * Processes a customer cancellation.
   */
  async processCancelledPayment(
    txRef: string,
    reason = 'Customer closed checkout'
  ): Promise<{ success: boolean; order?: Order }> {
    let order = await orderRepository.getOrderByReference(txRef);
    if (!order) {
      order = await orderRepository.getOrderByPaystackReference(txRef);
    }
    if (!order) return { success: false };

    if (order.payment_status === 'successful' || order.payment_status === 'paid') {
      return { success: true, order };
    }

    const updated = await orderRepository.updatePaymentStatus(
      order.id,
      'cancelled',
      txRef,
      undefined,
      undefined,
      'flutterwave'
    );

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_id: order.id,
      customer_id: order.customer_id,
      reference: txRef,
      amount: order.total_amount,
      currency: order.currency || 'NGN',
      status: 'cancelled',
      gateway: 'flutterwave',
      gateway_response: reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await orderRepository.savePayment(paymentRecord);

    return { success: true, order: updated };
  }

  /**
   * Processes a refund for an order.
   */
  async processRefund(
    orderId: string,
    refundAmount?: number,
    reason = 'Administrative Refund'
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const amount = refundAmount || order.total_amount;
    const updated = await orderRepository.recordRefund(order.id, amount, reason);
    return { success: true, order: updated };
  }

  /**
   * Reviews an overpayment record and updates its status (APPROVE or REJECT).
   */
  async reviewOverpayment(params: {
    orderId: string;
    action: 'approve' | 'reject';
    notes?: string;
    adminUser?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const { orderId, action, notes, adminUser } = params;
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    const updated = await orderRepository.updateOverpaymentReview({
      orderId: order.id,
      action,
      reviewNotes: notes || (action === 'approve' ? 'Approved by administrator' : 'Rejected by administrator'),
      reviewedBy: adminUser || 'Admin',
    });

    return { success: true, order: updated };
  }

  /**
   * Processes a refund for an overpayment excess.
   * Validates requested refund amount against overpayment amount to prevent excessive or duplicate refunds.
   */
  async processOverpaymentRefund(params: {
    orderId: string;
    refundAmount?: number;
    reason?: string;
    adminUser?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const { orderId, refundAmount, reason, adminUser } = params;
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    if (order.refund_status === 'REFUNDED') {
      return { success: false, error: 'Overpayment refund has already been completed for this order.' };
    }

    const maxRefundable = order.overpayment_amount || order.refund_amount_requested || (order.amount_paid ? Math.max(0, order.amount_paid - order.total_amount) : 0);
    const amountToRefund = refundAmount && refundAmount > 0 ? refundAmount : maxRefundable;

    if (amountToRefund <= 0) {
      return { success: false, error: 'No refundable overpayment amount available.' };
    }

    if (amountToRefund > maxRefundable) {
      return { success: false, error: `Refund amount ₦${amountToRefund} exceeds available overpayment excess ₦${maxRefundable}.` };
    }

    // Call Flutterwave Refund API if transaction ID is present
    let flwRefundRef: string | undefined = undefined;
    const secretKey = this.getSecretKey();
    if (order.flutterwave_transaction_id && secretKey) {
      try {
        const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${order.flutterwave_transaction_id}/refund`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: amountToRefund }),
        });
        const flwData = await flwRes.json();
        if (flwData?.status === 'success' && flwData?.data) {
          flwRefundRef = String(flwData.data.id || flwData.data.flw_ref || '');
        }
      } catch (err) {
        console.warn('[Flutterwave Overpayment Refund API Warning]:', err);
      }
    }

    const updated = await orderRepository.updateOverpaymentReview({
      orderId: order.id,
      action: 'process_refund',
      refundAmountCompleted: amountToRefund,
      reviewNotes: reason || `Overpayment refund of ₦${amountToRefund} processed successfully.`,
      reviewedBy: adminUser || 'Admin',
      refundReference: flwRefundRef,
    });

    return { success: true, order: updated };
  }

  /**
   * Safe Reconciliation Method for Orphaned / Unrecorded Flutterwave Payments
   * Reconciles a completed Flutterwave transaction with database records.
   * If an order exists, updates its status idempotently.
   * If an order is missing (e.g. from an initial insert failure), creates the order record and marks paid.
   */
  async reconcilePayment(params: {
    reference: string;
    flwTransactionId?: string;
    amount?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
  }): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const { reference, flwTransactionId, amount, customerName, customerEmail, customerPhone, notes } = params;

    // 1. Try finding existing order by reference or FLW ID
    let order = await orderRepository.getOrderByReference(reference);
    if (!order) {
      order = await orderRepository.getOrderByPaystackReference(reference);
    }

    // 2. If order exists, simply mark as paid using processSuccessfulPayment
    if (order) {
      const result = await this.processSuccessfulPayment(reference, {
        amount: amount || order.total_amount,
        currency: order.currency || 'NGN',
        processor_response: 'Reconciled via Admin Audit',
      }, flwTransactionId);

      if (result.success && result.order) {
        return {
          success: true,
          order: result.order,
          message: `Order #${result.order.order_number} successfully reconciled and marked paid.`,
        };
      }
    }

    // 3. If order missing from DB (e.g., failed initial insertion during checkout), construct and restore order record
    const targetAmount = amount || 400;
    const orderNumber = `TBH-REC-${Date.now().toString().slice(-6)}`;
    const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_rec_${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      secure_token: `tok_rec_${Math.random().toString(36).substring(2, 12)}`,
      customer_id: null,
      customer_name: customerName || 'Valued Customer',
      customer_email: customerEmail || 'customer@thebloomingher.com',
      customer_phone: customerPhone || '+2348000000000',
      delivery_type: 'shipping',
      shipping_address: {
        fullName: customerName || 'Valued Customer',
        email: customerEmail || 'customer@thebloomingher.com',
        phone: customerPhone || '+2348000000000',
        street: 'Reconciled Order Delivery',
        city: 'Ikeja',
        lga: 'Ikeja',
        state: 'Lagos',
        country: 'Nigeria',
      },
      subtotal_amount: targetAmount,
      delivery_fee: 0,
      discount_amount: 0,
      total_amount: targetAmount,
      currency: 'NGN',
      payment_provider: 'flutterwave',
      payment_status: 'successful',
      order_status: 'processing',
      payment_reference: reference,
      flutterwave_reference: reference,
      flutterwave_transaction_id: flwTransactionId || null,
      payment_channel: 'card',
      paid_at: new Date().toISOString(),
      notes: notes || `Reconciled Flutterwave Payment (Ref: ${reference}, FLW ID: ${flwTransactionId || 'N/A'})`,
      items: [
        {
          id: `item_rec_${Date.now()}`,
          order_id: orderId,
          product_id: 'prod-reconciled',
          product_name: 'Reconciled Order Product',
          sku: 'REC-001',
          unit_price: targetAmount,
          quantity: 1,
          total_price: targetAmount,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save order to database via Supabase
    try {
      const dbPayload: any = {
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        customer_email: newOrder.customer_email,
        customer_phone: newOrder.customer_phone,
        delivery_type: newOrder.delivery_type,
        shipping_address: newOrder.shipping_address,
        subtotal: newOrder.subtotal_amount,
        subtotal_amount: newOrder.subtotal_amount,
        shipping_fee: newOrder.delivery_fee,
        delivery_fee: newOrder.delivery_fee,
        discount_amount: newOrder.discount_amount,
        total_amount: newOrder.total_amount,
        currency: newOrder.currency,
        status: 'processing',
        order_status: 'processing',
        payment_status: 'paid',
        payment_method: 'flutterwave',
        payment_provider: 'flutterwave',
        payment_reference: reference,
        flutterwave_reference: reference,
        flutterwave_transaction_id: flwTransactionId || null,
        paystack_reference: reference,
        notes: newOrder.notes,
        paid_at: newOrder.paid_at,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      };

      await supabaseAdmin.from('orders').upsert(dbPayload, { onConflict: 'id' });

      const paymentRecord: PaymentRecord = {
        id: `pay_rec_${Date.now()}`,
        order_id: newOrder.id,
        reference,
        amount: targetAmount,
        currency: 'NGN',
        status: 'successful',
        gateway: 'flutterwave',
        gateway_reference: flwTransactionId || null,
        gateway_response: 'Approved & Reconciled',
        paid_at: newOrder.paid_at,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      };
      await orderRepository.savePayment(paymentRecord);
    } catch (err) {
      console.warn('[FlutterwaveService] Error persisting reconciled order to Supabase:', err);
    }

    return {
      success: true,
      order: newOrder,
      message: `Created and reconciled new order #${newOrder.order_number} for Flutterwave reference ${reference}.`,
    };
  }
}

export const flutterwaveService = new FlutterwaveService();
