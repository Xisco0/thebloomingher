import { catalogService } from './catalog.service';
import { orderService } from './order.service';
import { paystackService } from './paystack.service';
import { CheckoutFormData } from '@/lib/validation/checkout.schema';
import { calculateDeliveryFee } from '@/lib/utils/nigeria-data';
import { generatePaystackReference } from '@/lib/utils/paystack';
import { cmsStore } from '@/lib/cms-store';
import { Order, CreateOrderDTO } from '@/types';

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

    // Dynamic Discount validation from database/CMS configuration
    let discountAmount = 0;
    if (data.discountCode) {
      const rawCode = data.discountCode.toUpperCase().trim();
      const discounts = cmsStore.getDiscounts();
      const matched = discounts.find(
        d => d.code.toUpperCase() === rawCode && d.is_active
      );

      if (matched) {
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
   * Validates checkout data, creates the pending order record, and initializes Paystack payment transaction.
   */
  async processCheckout(
    data: CheckoutFormData,
    originUrl = 'https://thebloomingher.com'
  ): Promise<ProcessCheckoutResult> {
    const validation = await this.validateCheckout(data);

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    const paystackReference = generatePaystackReference('tbh');
    let authorizationUrl: string | undefined;
    let accessCode: string | undefined;

    // If customer selected Paystack online payment, initialize transaction
    if (data.paymentMethod === 'paystack') {
      const callbackUrl = `${originUrl}/api/paystack/verify`;

      const paystackInit = await paystackService.initializeTransaction({
        email: data.customerEmail,
        amountInNaira: validation.totalAmount,
        reference: paystackReference,
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
      paystackReference,
      paystackAccessCode: accessCode,
      paystackAuthorizationUrl: authorizationUrl,
    };

    const order = await orderService.createOrder(orderPayload);

    return {
      success: true,
      order,
      authorizationUrl,
      accessCode,
      reference: paystackReference,
    };
  }
}

export const checkoutService = new CheckoutService();
