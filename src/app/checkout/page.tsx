'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
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
  RefreshCw,
  Edit3,
  User,
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

interface AuthenticatedCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  delivery_address?: {
    street?: string;
    city?: string;
    state?: string;
    lga?: string;
  };
}

/**
 * Ensures the official Flutterwave v3 Inline checkout script is loaded dynamically.
 */
function loadFlutterwaveScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && typeof (window as any).FlutterwaveCheckout === 'function') {
      resolve(true);
      return;
    }

    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]');
    if (existing) {
      if (typeof (window as any).FlutterwaveCheckout === 'function') {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => {
        resolve(typeof (window as any).FlutterwaveCheckout === 'function');
      });
      setTimeout(() => {
        resolve(typeof (window as any).FlutterwaveCheckout === 'function');
      }, 1000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => {
      resolve(typeof (window as any).FlutterwaveCheckout === 'function');
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentErrorParam = searchParams.get('error');
  const { items, subtotal, clearCart } = useCart();

  // Authenticated Customer State
  const [customer, setCustomer] = useState<AuthenticatedCustomer | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);

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
    paymentMethod: 'flutterwave' as 'flutterwave' | 'paystack',
    discountCode: '',
  });

  const [phoneError, setPhoneError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');

  // Fetch logged in customer on mount
  useEffect(() => {
    fetch('/api/auth/customer/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.customer) {
          setCustomer(data.customer);
          const cust = data.customer;
          const fullName = `${cust.first_name || ''} ${cust.last_name || ''}`.trim();
          setFormData(prev => ({
            ...prev,
            fullName: fullName || prev.fullName,
            email: cust.email || prev.email,
            phone: prev.phone || cust.phone || '',
            street: prev.street || cust.delivery_address?.street || '',
            state: cust.delivery_address?.state || prev.state,
            city: cust.delivery_address?.city || prev.city,
            lga: cust.delivery_address?.lga || prev.lga,
          }));
        }
      })
      .catch(() => {});
  }, []);

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

  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError('');
    const code = discountInput.trim().toUpperCase();

    if (!code) return;

    setIsCheckingDiscount(true);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.discount) {
        setAppliedDiscount({
          code: data.discount.code,
          amount: data.discount.amount,
        });
        setFormData(prev => ({ ...prev, discountCode: data.discount.code }));
        setDiscountError('');
      } else {
        setDiscountError(data.message || 'Invalid or expired discount code.');
      }
    } catch (err: any) {
      setDiscountError('Unable to validate discount code. Please try again.');
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
    setDiscountError('');
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

      // 1. Flutterwave Modal Overlay Checkout
      if (formData.paymentMethod === 'flutterwave') {
        const scriptReady = await loadFlutterwaveScript();
        const hasFlutterwave = typeof window !== 'undefined' && typeof (window as any).FlutterwaveCheckout === 'function';

        if (hasFlutterwave && scriptReady) {
          const flwPublicKey = data.publicKey || process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || '';

          let flwModal: any = null;

          const removeFlutterwaveOverlay = () => {
            try {
              if (flwModal && typeof flwModal.close === 'function') {
                flwModal.close();
              }
            } catch (e) {
              // ignore
            }
            try {
              const elements = document.querySelectorAll(
                'iframe[src*="flutterwave"], iframe[name="checkout"], [id*="flw"], .flwpugrid, [class*="flutterwave"], div[style*="position: fixed"][style*="z-index"]'
              );
              elements.forEach(el => {
                // only remove if it belongs to flutterwave modal
                if (el.tagName === 'IFRAME' || el.className.includes('flw') || el.id.includes('flw')) {
                  el.remove();
                }
              });
              document.body.style.overflow = '';
            } catch (e) {
              // ignore
            }
          };

          flwModal = (window as any).FlutterwaveCheckout({
            public_key: flwPublicKey,
            tx_ref: data.reference || data.order.payment_reference,
            amount: data.totalAmount || data.order.total_amount,
            currency: data.order.currency || 'NGN',
            payment_options: 'card,banktransfer,ussd,account,qr',
            customer: {
              email: data.order.customer_email || formData.email.trim(),
              phone_number: data.order.customer_phone || cleanNumber,
              name: data.order.customer_name || formData.fullName.trim(),
            },
            customizations: {
              title: 'TheBloomingHer Care & Wellness',
              description: `Payment for Order #${data.orderNumber}`,
              logo: `${window.location.origin}/images/logo.jpg`,
            },
            meta: {
              order_id: data.order.id,
              order_number: data.orderNumber,
              customer_id: customer?.id || '',
            },
            callback: async function (flwResponse: any) {
              // Immediately close and remove the Flutterwave overlay
              removeFlutterwaveOverlay();

              // CRITICAL: Verify transaction with server backend!
              try {
                const verifyRes = await fetch('/api/flutterwave/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tx_ref: flwResponse.tx_ref || data.reference,
                    transaction_id: flwResponse.transaction_id || flwResponse.id,
                    status: flwResponse.status,
                  }),
                });

                const verifyData = await verifyRes.json();

                if (verifyData.success && verifyData.orderNumber) {
                  clearCart();
                  window.location.href = `/order-confirmation/${verifyData.orderNumber}?status=paid&token=${verifyData.secureToken || data.order.secure_token || ''}`;
                } else {
                  setServerErrors([
                    verifyData.error || 'Payment verification could not be confirmed. Please check your order confirmation or contact customer care.',
                  ]);
                  setIsProcessing(false);
                }
              } catch (verifyErr) {
                // Fallback to GET redirect verification
                clearCart();
                window.location.href = `/api/flutterwave/verify?tx_ref=${encodeURIComponent(data.reference)}&transaction_id=${encodeURIComponent(flwResponse.transaction_id || flwResponse.id || '')}&status=${encodeURIComponent(flwResponse.status || 'successful')}`;
              }
            },
            onclose: function () {
              removeFlutterwaveOverlay();
              setIsProcessing(false);
            },
          });
          return;
        }

        // Fallback to hosted checkout link if modal script unavailable
        if (data.authorizationUrl) {
          clearCart();
          window.location.href = data.authorizationUrl;
          return;
        }
      }

      // 2. Paystack Gateway (Fallback / Legacy)
      if (formData.paymentMethod === 'paystack' && data.authorizationUrl) {
        clearCart();
        window.location.href = data.authorizationUrl;
        return;
      }

      // 3. Direct Bank Transfer or Store Pickup
      clearCart();
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
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
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
                {customer ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Signed In</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Guest Checkout</span>
                    <span className="text-text-muted text-xs">•</span>
                    <Link
                      href={`/account/login?redirect=${encodeURIComponent('/checkout')}`}
                      className="text-xs text-brand font-semibold hover:underline"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              {customer && !isEditingContact ? (
                /* Authenticated User Verified Profile View */
                <div className="p-4 sm:p-5 rounded-2xl bg-brand-light/30 border border-brand/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                        {customer.first_name ? customer.first_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-text-main">
                            {customer.first_name} {customer.last_name}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified Customer
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">{customer.email}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingContact(true)}
                      className="text-xs text-brand font-semibold hover:underline self-start sm:self-auto flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change contact details</span>
                    </button>
                  </div>

                  {/* Phone number input for delivery updates */}
                  <div className="pt-3 border-t border-brand/10">
                    <label className="block text-xs font-semibold text-text-main mb-1.5">
                      Nigerian Delivery / WhatsApp Phone *{' '}
                      <span className="text-text-muted font-normal">
                        (Required for dispatch rider & delivery updates)
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0810 364 1002"
                      className="w-full px-4 py-2.5 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand shadow-xs"
                    />
                    {phoneError && (
                      <p className="text-[11px] text-red-600 mt-1.5 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Guest Checkout Form or Expanded Edit Mode */
                <div className="space-y-3 text-xs sm:text-sm">
                  {customer && isEditingContact && (
                    <div className="flex items-center justify-between pb-1">
                      <p className="text-xs text-text-muted">Edit contact details for this order:</p>
                      <button
                        type="button"
                        onClick={() => setIsEditingContact(false)}
                        className="text-xs text-brand font-semibold hover:underline cursor-pointer"
                      >
                        Done Editing
                      </button>
                    </div>
                  )}

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
              )}
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
                <div className="p-4 rounded-2xl border-2 border-brand bg-brand-light/30 flex items-start gap-3 transition-all">
                  <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand" />
                      <span className="font-bold text-text-main">
                        Flutterwave Secure Checkout (Cards, Bank Transfer, USSD, Apple Pay)
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Pay instantly using Debit/Credit Cards (Mastercard, Visa, Verve), instant Bank Transfer, USSD, or Apple Pay.
                    </p>
                  </div>
                </div>
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
                  <span>Opening Flutterwave Secure Checkout...</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {formData.paymentMethod === 'flutterwave'
                      ? `Pay ${formatNaira(grandTotal)} with Flutterwave`
                      : `Place Order • ${formatNaira(grandTotal)}`}
                  </span>
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
              <form onSubmit={handleApplyDiscount} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={e => setDiscountInput(e.target.value)}
                    placeholder="Discount code"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-muted border border-border text-xs text-text-main focus:outline-none focus:border-brand uppercase placeholder:normal-case min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingDiscount || !discountInput.trim()}
                    className="px-4 py-2.5 bg-surface-muted hover:bg-brand hover:text-white text-text-main font-semibold text-xs rounded-xl border border-border transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {isCheckingDiscount ? 'Checking...' : 'Apply'}
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
              Your payment information is encrypted and processed safely through Flutterwave. Discreet packaging is guaranteed on all orders.
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
