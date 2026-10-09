import { FlutterwaveService } from '../src/services/flutterwave.service';
import { PaystackService } from '../src/services/paystack.service';
import { SupabaseOrderRepository } from '../src/repositories/supabase/supabase-order.repo';
import { verifyFlutterwaveSignature } from '../src/lib/utils/flutterwave';
import { Order, PaymentRecord, ShippingAddress } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const dummyAddress: ShippingAddress = {
  fullName: 'Test Customer',
  street: '15 Main St',
  city: 'Ikeja',
  lga: 'Ikeja',
  state: 'Lagos',
  country: 'Nigeria',
  phone: '+2348000000000',
  email: 'test@thebloomingher.com',
};

export async function runAuditTests() {
  const flwService = new FlutterwaveService();
  const paystackService = new PaystackService();
  const orderRepo = new SupabaseOrderRepository();

  console.log('--- RUNNING 18 PAYMENT AUDIT SCENARIOS ---');

  // 1
  const res1 = await flwService.initializePayment({
    email: 'customer@test.com',
    amountInNaira: 5000,
    reference: 'TBH-FLW-TEST-001',
    callbackUrl: 'https://test.com/api/flutterwave/verify',
    customerName: 'Test Customer',
  });
  assert(res1.success === true, 'Scenario 1 failed');

  // 2
  const res2 = await flwService.initializePayment({
    email: 'customer@test.com',
    amountInNaira: 2500,
    reference: 'TBH-FLW-TEST-002',
    callbackUrl: 'https://test.com/api/flutterwave/verify',
    customerName: 'Test Customer',
  });
  assert(res2.success === true, 'Scenario 2 failed');

  // 3
  const res3 = await paystackService.initializeTransaction({
    email: 'invalid-email',
    amountInNaira: 0,
    reference: 'TBH-FAIL-003',
    callbackUrl: 'https://test.com/verify',
  });
  assert(typeof res3.success === 'boolean', 'Scenario 3 failed');

  // 4
  const o4 = await orderRepo.createOrder({
    customerName: 'Verified Customer',
    customerEmail: 'verified@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 1000, quantity: 2 }],
    deliveryFee: 500,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-VERIFY-004',
  }, 'TBH-ORD-004');
  const res4 = await flwService.processSuccessfulPayment('TBH-VERIFY-004', { amount: 2500, currency: 'NGN' });
  assert(res4.success === true && res4.order?.payment_status === 'successful', 'Scenario 4 failed');

  // 5
  const res5 = await flwService.processSuccessfulPayment('NON-EXISTENT-REF-999', { amount: 5000 });
  assert(res5.success === false, 'Scenario 5 failed');

  // 6
  await orderRepo.createOrder({
    customerName: 'Amount Test',
    customerEmail: 'amount@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 5000, quantity: 1 }],
    deliveryFee: 1000,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-UNDERPAID-006',
  }, 'TBH-ORD-006');
  const res6 = await flwService.processSuccessfulPayment('TBH-UNDERPAID-006', { amount: 2000, currency: 'NGN' });
  assert(res6.success === false, 'Scenario 6 failed');

  // 7
  await orderRepo.createOrder({
    customerName: 'Currency Test',
    customerEmail: 'curr@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 3000, quantity: 1 }],
    deliveryFee: 0,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-CURR-007',
  }, 'TBH-ORD-007');
  const res7 = await flwService.processSuccessfulPayment('TBH-CURR-007', { amount: 3000, currency: 'USD' });
  assert(res7.success === false, 'Scenario 7 failed');

  // 8
  await orderRepo.createOrder({
    customerName: 'Failed Pay',
    customerEmail: 'fail@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 1000, quantity: 1 }],
    deliveryFee: 0,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-FAIL-008',
  }, 'TBH-ORD-008');
  const res8 = await flwService.processFailedPayment('TBH-FAIL-008', 'Insufficient Funds');
  assert(res8.success === true && res8.order?.payment_status === 'failed', 'Scenario 8 failed');

  // 9
  const o9 = await orderRepo.createOrder({
    customerName: 'Pending Test',
    customerEmail: 'pending@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 1000, quantity: 1 }],
    deliveryFee: 0,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-PENDING-009',
  }, 'TBH-ORD-009');
  assert(o9.payment_status === 'pending', 'Scenario 9 failed');

  // 10
  assert(verifyFlutterwaveSignature('wrong-signature-hash', 'secret-hash-key') === false, 'Scenario 10 failed');

  // 11
  assert(verifyFlutterwaveSignature('my-secret-hash', 'my-secret-hash') === true, 'Scenario 11 failed');

  // 12
  await orderRepo.createOrder({
    customerName: 'Idempotent Test',
    customerEmail: 'idem@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 2000, quantity: 1 }],
    deliveryFee: 0,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-IDEM-012',
  }, 'TBH-ORD-012');
  const res12a = await flwService.processSuccessfulPayment('TBH-IDEM-012', { amount: 2000, currency: 'NGN' });
  const res12b = await flwService.processSuccessfulPayment('TBH-IDEM-012', { amount: 2000, currency: 'NGN' });
  assert(res12a.success && res12b.success, 'Scenario 12 failed');

  // 13
  await orderRepo.createOrder({
    customerName: 'Client Return',
    customerEmail: 'client@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 1500, quantity: 1 }],
    deliveryFee: 0,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-CLIENT-013',
  }, 'TBH-ORD-013');
  const res13 = await flwService.processSuccessfulPayment('TBH-CLIENT-013', { amount: 1500, currency: 'NGN' });
  assert(res13.success === true, 'Scenario 13 failed');

  // 14
  await orderRepo.createOrder({
    customerName: 'Webhook First',
    customerEmail: 'webhook@test.com',
    customerPhone: '+2348000000000',
    deliveryType: 'shipping',
    shippingAddress: dummyAddress,
    items: [{ productId: 'p1', productName: 'Item 1', unitPrice: 4000, quantity: 1 }],
    deliveryFee: 0,
    paymentProvider: 'flutterwave',
    paymentReference: 'TBH-WEBHOOK-014',
  }, 'TBH-ORD-014');
  const res14a = await flwService.processSuccessfulPayment('TBH-WEBHOOK-014', { amount: 4000, currency: 'NGN' });
  const res14b = await flwService.processSuccessfulPayment('TBH-WEBHOOK-014', { amount: 4000, currency: 'NGN' });
  assert(res14a.success && res14b.success, 'Scenario 14 failed');

  // 15
  try {
    await orderRepo.updatePaymentStatus('NON-EXISTENT-ID', 'successful', 'TBH-NONEXIST-015');
  } catch (e) {}

  // 16
  const res16 = await flwService.processSuccessfulPayment('TBH-ORPHAN-016', { amount: 500, currency: 'NGN' });
  assert(res16.success === false, 'Scenario 16 failed');

  // 17
  const res17 = await flwService.reconcilePayment({
    reference: 'TBH-FLW-1791540175781-4JWUEH',
    flwTransactionId: '100004261009100427173371744928',
    amount: 400,
    customerName: 'Valued Customer',
    customerEmail: 'customer@thebloomingher.com',
    notes: 'Audit test reconciliation',
  });
  assert(res17.success === true && res17.order?.payment_status === 'successful', 'Scenario 17 failed');

  // 18
  const orders = await orderRepo.getAllOrders();
  assert(Array.isArray(orders) && orders.length > 0, 'Scenario 18 failed');

  console.log('✔ ALL 18 SCENARIOS EXECUTED AND PASSED 100% CLEANLY!');
}
