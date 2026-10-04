import { catalogService } from './catalog.service';
import { orderService } from './order.service';
import { flutterwaveService } from './flutterwave.service';
import { paystackService } from './paystack.service';
import { CheckoutFormData } from '@/lib/validation/checkout.schema';
import { calculateDeliveryFee } from '@/lib/utils/nigeria-data';
import { generateFlutterwaveReference } from '@/lib/utils/flutterwave';
import { generatePaystackReference } from '@/lib/utils/paystack';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Order, CreateOrderDTO, PaymentProvider } from '@/types';

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: string[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  validatedItems: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
    sku: string;
  }>;
}

export interface ProcessCheckoutResult {
  success: boolean;
  order?: Order;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  errors?: string[];
}

export class CheckoutService {
  /**
   * Validates cart items and calculates authoritative totals server-side.
   * Client-supplied prices and delivery fees are NEVER trusted.
   */
  async validateCheckout(data: CheckoutFormData): Promise<CheckoutValidationResult> {
    const errors: string[] = [];
    const validatedItems: CheckoutValidationResult['validatedItems'] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = await catalogService.getProductById(item.productId);

      if (!product) {
        errors.push(`Product with ID "${item.productId}" is no longer available.`);
        continue;
      }

      if (product.status !== 'active') {
        errors.push(`"${product.name}" is currently inactive and cannot be purchased.`);
        continue;
      }

      // Check variant if applicable
      let unitPrice = product.price;
      let sku = product.sku;
      let availableStock = product.stock_quantity;
      let productName = product.name;

      if (item.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) {
          errors.push(`Selected option for "${product.name}" is invalid.`);
          continue;
        }
        if (variant.price_override) {
          unitPrice = variant.price_override;
        }
        sku = variant.sku;
        availableStock = variant.stock_quantity;
        productName = `${product.name} (${variant.title})`;
      }

      // Inventory validation
      if (availableStock < item.quantity) {
        errors.push(
          `Only ${availableStock} units of "${productName}" are currently in stock (requested: ${item.quantity}).`
        );
        continue;
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        variantId: item.variantId,
        productName,
        unitPrice,
        quantity: item.quantity,
        imageUrl: product.images?.[0]?.url || '',
        sku,
      });
    }

    // Delivery fee calculation based on server rule
    const deliveryFee = calculateDeliveryFee(
      data.shippingAddress.state,
      data.deliveryType,
      subtotal
    );

    // Dynamic Discount validation from database / CMS configuration
    let discountAmount = 0;
    if (data.discountCode) {
      const rawCode = data.discountCode.toUpperCase().trim();
      let matched: any = undefined;

      // 1. Query Supabase marketing_coupons table
      try {
        const { data: dbCoupon, error } = await supabaseAdmin
          .from('marketing_coupons')
          .select('*')
          .eq('code', rawCode)
          .maybeSingle();

        if (!error && dbCoupon) {
          matched = {
            id: dbCoupon.id,
            code: dbCoupon.code,
            type: dbCoupon.discount_type === 'fixed' || dbCoupon.discount_type === 'fixed_amount' ? 'fixed_amount' : 'percentage',
            value: Number(dbCoupon.discount_value || 0),
            min_spend: Number(dbCoupon.minimum_spend || 0),
            usage_limit: dbCoupon.usage_limit ? Number(dbCoupon.usage_limit) : undefined,
            usage_count: Number(dbCoupon.usage_count || 0),
            is_active: dbCoupon.status === 'active',
            end_date: dbCoupon.end_date,
          };
        }
      } catch (e) {}

      // 2. Fallback to memory store
      if (!matched) {
        const discounts = cmsStore.getDiscounts();
        matched = discounts.find(
          d => d.code.toUpperCase() === rawCode && d.is_active
        );
      }

      if (matched && matched.is_active) {
        if (matched.end_date && new Date(matched.end_date) < new Date()) {
          errors.push(`Discount code "${data.discountCode}" has expired.`);
        } else if (matched.min_spend && subtotal < matched.min_spend) {
          errors.push(`Discount code requires a minimum purchase of ₦${matched.min_spend.toLocaleString()}.`);
        } else if (matched.usage_limit && matched.usage_count >= matched.usage_limit) {
          errors.push(`Discount code usage limit has been reached.`);
        } else {
          if (matched.type === 'percentage') {
            discountAmount = Math.round((subtotal * matched.value) / 100);
            if (matched.max_discount && discountAmount > matched.max_discount) {
              discountAmount = matched.max_discount;
            }
          } else {
            discountAmount = Math.min(subtotal, matched.value);
          }
        }
      } else {
        errors.push(`Discount code "${data.discountCode}" is invalid or expired.`);
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    return {
      isValid: errors.length === 0,
      errors,
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      validatedItems,
    };
  }

  /**
   * Validates checkout data, creates the pending order record, and initializes online payment transaction.
   */
  async processCheckout(
    data: CheckoutFormData,
    originUrl = 'https://www.thebloomingher.com'
  ): Promise<ProcessCheckoutResult> {
    const validation = await this.validateCheckout(data);

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    const paymentMethod: PaymentProvider = data.paymentMethod as PaymentProvider;
    let paymentReference: string;
    let authorizationUrl: string | undefined;
    let accessCode: string | undefined;

    // 1. Flutterwave Payment Initialization (Default Online Gateway)
    if (paymentMethod === 'flutterwave') {
      paymentReference = generateFlutterwaveReference('TBH-FLW');
      const callbackUrl = `${originUrl}/api/flutterwave/verify`;

      const flwInit = await flutterwaveService.initializePayment({
        email: data.customerEmail,
        amountInNaira: validation.totalAmount,
        reference: paymentReference,
        callbackUrl,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        metadata: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryType: data.deliveryType,
          itemCount: validation.validatedItems.length,
        },
      });

      if (!flwInit.success) {
        return {
          success: false,
          errors: [flwInit.error || 'Could not initialize Flutterwave payment. Please try again.'],
        };
      }

      authorizationUrl = flwInit.authorizationUrl;
    } else if (paymentMethod === 'paystack') {
      // 2. Paystack Payment Initialization (Legacy/Alternative Gateway)
      paymentReference = generatePaystackReference('tbh');
      const callbackUrl = `${originUrl}/api/paystack/verify`;

      const paystackInit = await paystackService.initializeTransaction({
        email: data.customerEmail,
        amountInNaira: validation.totalAmount,
        reference: paymentReference,
        callbackUrl,
        metadata: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryType: data.deliveryType,
          itemCount: validation.validatedItems.length,
        },
      });

      if (!paystackInit.success) {
        return {
          success: false,
          errors: [paystackInit.error || 'Could not initialize Paystack transaction. Please try again.'],
        };
      }

      authorizationUrl = paystackInit.authorizationUrl;
      accessCode = paystackInit.accessCode;
    } else {
      // 3. Direct Bank Transfer (Manual verification)
      paymentReference = `TBH-BT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    const orderPayload: CreateOrderDTO = {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      deliveryType: data.deliveryType,
      shippingAddress: data.shippingAddress,
      items: validation.validatedItems,
      deliveryFee: validation.deliveryFee,
      discountAmount: validation.discountAmount,
      notes: data.notes || data.shippingAddress.deliveryInstructions,
      paymentProvider: paymentMethod,
      paymentReference,
      flutterwaveReference: paymentMethod === 'flutterwave' ? paymentReference : undefined,
      flutterwaveAuthorizationUrl: paymentMethod === 'flutterwave' ? authorizationUrl : undefined,
      paystackReference: paymentMethod === 'paystack' ? paymentReference : undefined,
      paystackAccessCode: accessCode,
      paystackAuthorizationUrl: paymentMethod === 'paystack' ? authorizationUrl : undefined,
    };

    const order = await orderService.createOrder(orderPayload);

    return {
      success: true,
      order,
      authorizationUrl,
      accessCode,
      reference: paymentReference,
    };
  }
}

export const checkoutService = new CheckoutService();
