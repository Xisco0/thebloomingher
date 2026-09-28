import { z } from 'zod';

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const CheckoutAddressSchema = z.object({
  fullName: z.string().min(3, 'Full name is required (minimum 3 characters)'),
  phone: z.string().min(10, 'A valid Nigerian phone number is required'),
  email: z.string().email('Please provide a valid email address'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  lga: z.string().optional().default(''),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('Nigeria'),
  deliveryInstructions: z.string().optional().default(''),
});

export const CheckoutFormSchema = z.object({
  customerName: z.string().min(3, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  deliveryType: z.enum(['shipping', 'pickup']),
  shippingAddress: CheckoutAddressSchema,
  items: z.array(CheckoutItemSchema).min(1, 'Cart cannot be empty'),
  paymentMethod: z.enum(['flutterwave', 'paystack', 'bank_transfer']).default('flutterwave'),
  discountCode: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;
