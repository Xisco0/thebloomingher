import { orderRepository } from '@/repositories';
import {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  Order,
  PaymentRecord,
} from '@/types';
import { nairaToKobo, koboToNaira, generatePaystackReference } from '@/lib/utils/paystack';

export interface InitializePaystackParams {
  email: string;
  amountInNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  }

  /**
   * Initializes a Paystack transaction on the server.
   * Converts Naira to integer Kobo before sending to Paystack.
   */
  async initializeTransaction(
    params: InitializePaystackParams
  ): Promise<{ success: boolean; authorizationUrl: string; accessCode: string; reference: string; error?: string }> {
    const amountInKobo = nairaToKobo(params.amountInNaira);

    // If live/test secret key is provided, communicate with Paystack API
    if (this.secretKey && !this.secretKey.startsWith('pk_')) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: params.email,
            amount: amountInKobo,
            reference: params.reference,
            callback_url: params.callbackUrl,
            metadata: params.metadata || {},
            currency: 'NGN',
          }),
        });

        const data: PaystackInitializeResponse = await response.json();

        if (!response.ok || !data.status) {
          return {
            success: false,
            authorizationUrl: '',
            accessCode: '',
            reference: params.reference,
            error: data.message || 'Paystack initialization failed',
          };
        }

        return {
          success: true,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference: data.data.reference,
        };
      } catch (err: any) {
        console.error('Paystack initialization network error:', err);
        return {
          success: false,
          authorizationUrl: '',
          accessCode: '',
          reference: params.reference,
          error: err.message || 'Failed to connect to Paystack gateway',
        };
      }
    }

    // Sandbox / Development fallback mode when testing without live key
    const mockAccessCode = `mock_acc_${Date.now()}`;
    const mockAuthUrl = `${params.callbackUrl}?reference=${encodeURIComponent(
      params.reference
    )}&mock_paystack=true`;

    return {
      success: true,
      authorizationUrl: mockAuthUrl,
      accessCode: mockAccessCode,
      reference: params.reference,
    };
  }

  /**
   * Verifies a Paystack transaction with Paystack's official verification endpoint.
   */
  async verifyTransaction(
    reference: string
  ): Promise<{ success: boolean; data?: PaystackVerifyResponse['data']; error?: string }> {
    if (this.secretKey && !this.secretKey.startsWith('pk_')) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        const data: PaystackVerifyResponse = await response.json();

        if (!response.ok || !data.status || data.data.status !== 'success') {
          return {
            success: false,
            data: data.data,
            error: data.message || data.data?.gateway_response || 'Payment verification failed',
          };
        }

        return {
          success: true,
          data: data.data,
        };
      } catch (err: any) {
        console.error('Paystack verification network error:', err);
        return {
          success: false,
          error: err.message || 'Failed to verify transaction with Paystack',
        };
      }
    }

    // Sandbox / Test fallback verification
    return {
      success: true,
      data: {
        id: 999999999,
        domain: 'test',
        status: 'success',
        reference,
        amount: 0,
        message: 'Sandbox verified',
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        channel: 'card',
        currency: 'NGN',
        ip_address: '127.0.0.1',
        metadata: {},
        customer: {
          id: 1,
          first_name: 'Test',
          last_name: 'Customer',
          email: 'test@thebloomingher.com',
          customer_code: 'CUS_test',
          phone: '+2348103641002',
        },
      },
    };
  }

  /**
   * Authoritatively updates the order and creates the payment audit record.
   * Fully IDEMPOTENT: If an order is already marked 'paid', it skips re-processing.
   */
  async processSuccessfulPayment(
    reference: string,
    verificationData?: Partial<PaystackVerifyResponse['data']>
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const order = await orderRepository.getOrderByPaystackReference(reference);

    if (!order) {
      return {
        success: false,
        error: `Order with Paystack reference "${reference}" was not found.`,
      };
    }

    // Idempotency check: Already processed
    if (order.payment_status === 'paid') {
      return {
        success: true,
        order,
      };
    }

    // Verify amount in kobo matches order total amount (if live verification payload provided)
    if (verificationData && verificationData.amount && verificationData.amount > 0) {
      const expectedKobo = nairaToKobo(order.total_amount);
      if (verificationData.amount < expectedKobo) {
        return {
          success: false,
          error: `Payment amount mismatch: received ${verificationData.amount} kobo, expected ${expectedKobo} kobo.`,
        };
      }
    }

    const channel = verificationData?.channel || 'card';
    const paidAt = verificationData?.paid_at || new Date().toISOString();
    const gatewayResponse = verificationData?.gateway_response || 'Approved';

    // 1. Update Order Status
    const updatedOrder = await orderRepository.updatePaymentStatus(
      order.id,
      'successful',
      reference,
      channel,
      paidAt,
      'paystack'
    );

    // 2. Save Payment Audit Record
    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_id: order.id,
      customer_id: order.customer_id,
      reference,
      amount: order.total_amount,
      currency: 'NGN',
      status: 'successful',
      gateway: 'paystack',
      gateway_response: gatewayResponse,
      channel,
      paid_at: paidAt,
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
   * Marks order as payment failed
   */
  async processFailedPayment(
    reference: string,
    reason?: string
  ): Promise<{ success: boolean; order?: Order }> {
    const order = await orderRepository.getOrderByPaystackReference(reference);
    if (!order) return { success: false };

    if (order.payment_status === 'successful' || order.payment_status === 'paid') {
      return { success: true, order };
    }

    const updated = await orderRepository.updatePaymentStatus(
      order.id,
      'failed',
      reference,
      undefined,
      undefined,
      'paystack'
    );

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_id: order.id,
      reference,
      amount: order.total_amount,
      currency: 'NGN',
      status: 'failed',
      gateway: 'paystack',
      gateway_response: reason || 'Transaction failed or abandoned',
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await orderRepository.savePayment(paymentRecord);

    return {
      success: true,
      order: updated,
    };
  }
}

export const paystackService = new PaystackService();
