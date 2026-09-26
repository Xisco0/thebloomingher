'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  MapPin,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Lock,
  Tag,
  CreditCard,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';
import {
  NIGERIAN_STATES,
  LAGOS_LGAS,
  STORE_PICKUP_LOCATION,
  normalizeNigerianPhone,
  calculateDeliveryFee,
  DELIVERY_RATES,
} from '@/lib/utils/nigeria-data';
import { analytics } from '@/lib/analytics/events';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentErrorParam = searchParams.get('error');
  const { items, subtotal, clearCart } = useCart();

  // Delivery & Contact State
  const [deliveryType, setDeliveryType] = useState<'shipping' | 'pickup'>('shipping');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    state: 'Lagos',
    city: 'Ikeja',
    lga: 'Ikeja',
    country: 'Nigeria',
    deliveryInstructions: '',
    paymentMethod: 'paystack' as 'paystack' | 'bank_transfer',
    discountCode: '',
  });

  const [phoneError, setPhoneError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');

  useEffect(() => {
    if (items.length > 0) {
      analytics.track('begin_checkout', {
        itemCount: items.length,
        subtotal,
      });
    }

    if (paymentErrorParam) {
      setServerErrors([
        'Your payment could not be completed or was cancelled. Your order has not been charged. Please try again below.',
      ]);
    }
  }, [paymentErrorParam]);

  // Live recalculations
  const deliveryFee = calculateDeliveryFee(formData.state, deliveryType, subtotal);
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'phone') {
      const { isValid } = normalizeNigerianPhone(value);
      if (value.length > 9 && !isValid) {
        setPhoneError('Please enter a valid Nigerian phone number (e.g. 0810 364 1002)');
      } else {
        setPhoneError('');
      }
    }

    if (name === 'state') {
      analytics.track('checkout_address_completed', { state: value });
    }
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError('');
    const code = discountInput.trim().toUpperCase();

    if (!code) return;

    if (code === 'WELCOME10') {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount({ code, amount: discount });
      setFormData(prev => ({ ...prev, discountCode: code }));
    } else {
      setDiscountError('Invalid discount code. Try WELCOME10 for 10% off.');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
    setFormData(prev => ({ ...prev, discountCode: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrors([]);

    if (items.length === 0) {
      setServerErrors(['Your shopping bag is empty.']);
      return;
    }

    const { isValid, cleanNumber } = normalizeNigerianPhone(formData.phone);
    if (!isValid) {
      setPhoneError('Please provide a valid Nigerian mobile phone number (10-11 digits).');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        customerName: formData.fullName.trim(),
        customerEmail: formData.email.trim(),
        customerPhone: cleanNumber,
        deliveryType,
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: cleanNumber,
          email: formData.email.trim(),
          street:
            deliveryType === 'pickup'
              ? `Store Pickup: ${STORE_PICKUP_LOCATION.address}`
              : formData.street.trim(),
          city: deliveryType === 'pickup' ? 'Ifako-Ijaiye' : formData.city.trim() || formData.lga,
          lga: deliveryType === 'pickup' ? 'Ifako-Ijaiye' : formData.lga,
          state: deliveryType === 'pickup' ? 'Lagos' : formData.state,
          country: 'Nigeria',
          deliveryInstructions: formData.deliveryInstructions.trim(),
        },
        items: items.map(it => ({
          productId: it.productId,
          variantId: it.variantId,
          quantity: it.quantity,
        })),
        paymentMethod: formData.paymentMethod,
        discountCode: appliedDiscount?.code || '',
        notes: formData.deliveryInstructions.trim(),
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerErrors(data.errors || ['Checkout processing failed. Please review your cart and address.']);
        setIsProcessing(false);
        return;
      }

      analytics.track('order_created', {
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
        itemCount: items.length,
      });

      // Clear cart
      clearCart();

      // If Paystack online payment with authorization URL, redirect to Paystack
      if (formData.paymentMethod === 'paystack' && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }

      // If direct bank transfer or pickup, forward to order confirmation
      router.push(`/order-confirmation/${data.orderNumber}?token=${data.order.secure_token || data.order.id}`);
    } catch (err: any) {
      setServerErrors([err.message || 'An unexpected error occurred. Please try again.']);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-text-main">Your Bag is Empty</h2>
        <p className="text-xs sm:text-sm text-text-muted max-w-sm mx-auto">
          Please add products to your bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-brand text-white rounded-full font-semibold text-xs sm:text-sm hover:bg-brand-hover transition-colors shadow-sm"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      {/* Checkout Header */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
          Secure Nigeria-First Checkout
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
          Order & Delivery Details
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Fast, discreet shipping across Lagos and all 36 Nigerian states.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Checkout Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {serverErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Please address the following:</span>
              </div>
              <ul className="list-disc list-inside pl-1 space-y-0.5">
                {serverErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Customer Contact Information */}
            <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-sans">
                    1
                  </span>
                  <span>Contact Information</span>
                </h2>
                <span className="text-xs text-text-muted">Guest Checkout</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-medium text-text-main mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Zainab Balogun"
                    className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-text-main mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="zainab@example.com"
                      className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-text-main mb-1">
                      Nigerian WhatsApp / Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0810 364 1002"
                      className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand"
                    />
                    {phoneError && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Method */}
            <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-sans">
                    2
                  </span>
                  <span>Delivery Method</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryType('shipping');
                    analytics.track('checkout_delivery_selected', { method: 'shipping' });
                  }}
                  className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                    deliveryType === 'shipping'
                      ? 'border-brand bg-brand-light/30 shadow-xs'
                      : 'border-border hover:border-brand/40 bg-surface'
                  }`}
                >
                  <Truck
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      deliveryType === 'shipping' ? 'text-brand' : 'text-text-muted'
                    }`}
                  />
                  <div>
                    <h3 className="font-semibold text-text-main">Direct Delivery</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {subtotal >= DELIVERY_RATES.FREE_SHIPPING_THRESHOLD
                        ? 'FREE Lagos Delivery (Over ₦40,000)'
                        : '₦2,500 Lagos | ₦4,500 Other States'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeliveryType('pickup');
                    analytics.track('checkout_delivery_selected', { method: 'pickup' });
                  }}
                  className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                    deliveryType === 'pickup'
                      ? 'border-brand bg-brand-light/30 shadow-xs'
                      : 'border-border hover:border-brand/40 bg-surface'
                  }`}
                >
                  <MapPin
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      deliveryType === 'pickup' ? 'text-brand' : 'text-text-muted'
                    }`}
                  />
                  <div>
                    <h3 className="font-semibold text-text-main">Free Store Pickup</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      30 Clem Rd, Ifako-Ijaiye, Lagos
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Shipping Address (if Home Delivery) */}
            {deliveryType === 'shipping' ? (
              <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border/80 shadow-subtle space-y-4">
                <div className="pb-3 border-b border-border/60">
                  <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-sans">
                      3
                    </span>
                    <span>Delivery Address</span>
                  </h2>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {/* State Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-text-main mb-1">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand cursor-pointer"
                      >
                        {NIGERIAN_STATES.map(s => (
                          <option key={s.code} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.state === 'Lagos' ? (
                      <div>
                        <label className="block font-medium text-text-main mb-1">
                          Lagos Area / LGA *
                        </label>
                        <select
                          name="lga"
                          value={formData.lga}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand cursor-pointer"
                        >
                          {LAGOS_LGAS.map(lga => (
                            <option key={lga} value={lga}>
                              {lga}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-medium text-text-main mb-1">City / Town *</label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="e.g. Ibadan, Port Harcourt, Abuja"
                          className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-text-main mb-1">
                      Street Address & Landmark *
                    </label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="e.g. 14 Admiralty Way, opposite Ebeano Supermarket"
                      className="w-full px-4 py-3 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-text-main mb-1">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      name="deliveryInstructions"
                      rows={2}
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      placeholder="Gate code, alternative phone, or delivery timing..."
                      className="w-full px-4 py-2.5 bg-surface-muted rounded-xl border border-border text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Store Pickup Information Card */
              <div className="bg-brand-light/30 rounded-3xl p-6 border border-brand/20 space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-brand">
                  <MapPin className="w-5 h-5 text-brand" />
                  <span>Pickup Location Details:</span>
                </div>
                <div className="space-y-1 text-text-body pl-7">
                  <p className="font-semibold text-text-main">{STORE_PICKUP_LOCATION.name}</p>
                  <p>{STORE_PICKUP_LOCATION.address}</p>
                  <p>{STORE_PICKUP_LOCATION.city}, {STORE_PICKUP_LOCATION.state}</p>
                  <p className="text-xs text-text-muted pt-1">Hours: {STORE_PICKUP_LOCATION.hours}</p>
                </div>
              </div>
            )}

            {/* Step 4: Payment Method Selection */}
            <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border/80 shadow-subtle space-y-4">
              <div className="pb-3 border-b border-border/60">
                <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-sans">
                    4
                  </span>
                  <span>Payment Method</span>
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <label
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    formData.paymentMethod === 'paystack'
                      ? 'border-brand bg-brand-light/30'
                      : 'border-border bg-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paystack"
                    checked={formData.paymentMethod === 'paystack'}
                    onChange={() => setFormData(prev => ({ ...prev, paymentMethod: 'paystack' }))}
                    className="w-4 h-4 text-brand accent-brand mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand" />
                      <span className="font-bold text-text-main">
                        Pay Online with Paystack (Cards, Bank Transfer, USSD)
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Supports Nigerian Debit Cards (Mastercard, Visa, Verve), instant Bank Transfer, and Apple Pay.
                    </p>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    formData.paymentMethod === 'bank_transfer'
                      ? 'border-brand bg-brand-light/30'
                      : 'border-border bg-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={formData.paymentMethod === 'bank_transfer'}
                    onChange={() =>
                      setFormData(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))
                    }
                    className="w-4 h-4 text-brand accent-brand mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-brand" />
                      <span className="font-bold text-text-main">
                        Direct Bank Transfer (Manual Verification)
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Transfer directly to our Nigerian bank account and send receipt on WhatsApp.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-6 bg-brand hover:bg-brand-hover disabled:bg-gray-400 text-white rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Redirecting to Paystack Secure Checkout...</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatNaira(grandTotal)} with Paystack</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-3xl p-6 sm:p-8 border border-border/80 shadow-subtle space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <h3 className="font-display font-bold text-lg text-text-main">
              Order Summary ({items.reduce((s, it) => s + it.quantity, 0)} items)
            </h3>
            <Link href="/cart" className="text-xs text-brand font-semibold hover:underline">
              Edit Bag
            </Link>
          </div>

          {/* Items Preview List */}
          <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1 space-y-3">
            {items.map(item => (
              <div key={item.productId} className="flex items-center gap-3 pt-3 first:pt-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-muted border border-border flex-shrink-0">
                  <Image
                    src={item.imageUrl || ''}
                    alt={item.productName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-text-main truncate">
                    {item.productName}
                  </h4>
                  <p className="text-[11px] text-text-muted">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-xs text-brand font-sans">
                  {formatNaira(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Price Calculations */}
          <div className="space-y-2.5 pt-4 border-t border-border/60 text-xs sm:text-sm">
            <div className="flex justify-between text-text-body">
              <span>Items Subtotal</span>
              <span className="font-semibold font-sans">{formatNaira(subtotal)}</span>
            </div>

            <div className="flex justify-between text-text-body">
              <span>Delivery Fee ({deliveryType === 'pickup' ? 'Store Pickup' : formData.state})</span>
              <span className="font-semibold font-sans">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase text-xs">Free</span>
                ) : (
                  formatNaira(deliveryFee)
                )}
              </span>
            </div>

            {appliedDiscount && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Promo ({appliedDiscount.code})
                </span>
                <span className="font-sans">-{formatNaira(appliedDiscount.amount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-display font-bold text-base text-text-main">
                Total to Pay
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-brand font-sans">
                {formatNaira(grandTotal)}
              </span>
            </div>
          </div>

          {/* Coupon Code Accordion Box */}
          <div className="pt-2">
            {appliedDiscount ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Coupon {appliedDiscount.code} applied</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="text-text-muted hover:text-red-600 font-semibold text-xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyDiscount} className="space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={e => setDiscountInput(e.target.value)}
                    placeholder="Discount code (e.g. WELCOME10)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-surface-muted border border-border text-xs text-text-main focus:outline-none focus:border-brand uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-surface-muted hover:bg-brand hover:text-white text-text-main font-semibold text-xs rounded-xl border border-border transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {discountError && (
                  <p className="text-[11px] text-red-600 font-medium pl-1">{discountError}</p>
                )}
              </form>
            )}
          </div>

          {/* Trust Callout */}
          <div className="bg-surface-muted rounded-2xl p-4 border border-border/80 space-y-2 text-[11px] text-text-muted">
            <div className="flex items-center gap-2 font-bold text-text-main">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Secure Checkout Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Your payment information is encrypted and processed safely through Paystack. Discreet packaging is guaranteed on all orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-text-muted">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
