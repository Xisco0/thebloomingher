'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Heart,
  Truck,
  ShieldCheck,
  Sparkles,
  Tag,
  Check,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';
import { analytics } from '@/lib/analytics/events';
import { recommendationService } from '@/services';
import { Product } from '@/types';
import { RecommendedProductsGrid } from '@/components/recommendation/RecommendedProductsGrid';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    freeShippingThreshold,
    amountUntilFreeShipping,
    hasFreeShipping,
    toggleWishlist,
    addItem,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [upsells, setUpsells] = useState<Product[]>([]);

  useEffect(() => {
    analytics.track('cart_view', {
      itemCount: items.length,
      subtotal,
    });

    // Load impulse recommendations
    recommendationService.getCartUpsells([]).then(setUpsells);
  }, []);

  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();

    if (!code) return;

    setIsCheckingPromo(true);
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
        setPromoError('');
      } else {
        setPromoError(data.message || 'Invalid or expired discount code.');
      }
    } catch (err: any) {
      setPromoError('Unable to validate discount code. Please try again.');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleQuantityChange = (productId: string, newQty: number, productName: string, price: number) => {
    updateQuantity(productId, newQty);
    analytics.track('cart_quantity_changed', {
      productId,
      productName,
      quantity: newQty,
      productPrice: price,
    });
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId);
    analytics.track('remove_from_cart', {
      productId,
      productName,
    });
  };

  const handleProceedToCheckout = () => {
    analytics.track('begin_checkout', {
      itemCount: items.length,
      subtotal,
      discountAmount: appliedDiscount?.amount || 0,
    });
    router.push('/checkout');
  };

  const estimatedDelivery = hasFreeShipping ? 0 : 2500;
  const grandTotal = Math.max(0, subtotal + estimatedDelivery - (appliedDiscount?.amount || 0));

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="bg-surface rounded-3xl p-8 sm:p-14 border border-border/80 shadow-subtle space-y-5 max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-display font-bold text-2xl text-text-main">
            Your shopping bag is empty
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Looks like you haven&apos;t added any wellness or period care essentials to your bag yet.
          </p>
          <div className="pt-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-4xl text-text-main">
          Shopping Bag ({items.reduce((sum, it) => sum + it.quantity, 0)} items)
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Review your chosen items and proceed to secure checkout.
        </p>
      </div>

      {/* Free Delivery Meter Bar */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle mb-8">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand" />
            {hasFreeShipping ? (
              <span className="text-emerald-700 font-bold">
                🎉 Congratulations! You qualify for Free Lagos Delivery!
              </span>
            ) : (
              <span className="text-text-main">
                Add <strong className="text-brand">{formatNaira(amountUntilFreeShipping)}</strong> more for <strong>Free Lagos Delivery</strong>
              </span>
            )}
          </div>
          <span className="text-text-muted hidden sm:inline">
            Goal: {formatNaira(freeShippingThreshold)}
          </span>
        </div>
        <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              hasFreeShipping ? 'bg-emerald-600' : 'bg-brand'
            }`}
            style={{
              width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Layout Grid: Items 65% | Order Summary 35% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-border/80 shadow-subtle divide-y divide-border/60">
            {items.map(item => (
              <div
                key={item.productId}
                className="py-4 sm:py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Image & Product Info */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-surface-muted border border-border flex-shrink-0">
                    <Image
                      src={item.imageUrl || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg'}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-brand tracking-wider">
                      {item.categoryName}
                    </span>
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-display font-semibold text-sm sm:text-base text-text-main hover:text-brand transition-colors block line-clamp-2"
                    >
                      {item.productName}
                    </Link>
                    <span className="font-bold text-sm text-brand font-sans block">
                      {formatNaira(item.unitPrice)}
                    </span>
                  </div>
                </div>

                {/* Stepper, Total, and Actions */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                  {/* Stepper */}
                  <div className="flex items-center border border-border rounded-full bg-surface-muted p-1">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.productId,
                          Math.max(1, item.quantity - 1),
                          item.productName,
                          item.unitPrice
                        )
                      }
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:bg-white transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold text-xs sm:text-sm text-text-main font-sans px-3">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.productId,
                          Math.min(item.maxStock, item.quantity + 1),
                          item.productName,
                          item.unitPrice
                        )
                      }
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:bg-white transition-colors disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Subtotal */}
                  <div className="text-right">
                    <span className="font-bold text-sm sm:text-base text-text-main font-sans">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  {/* Actions (Save to Wishlist & Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        toggleWishlist(item.productId);
                        handleRemoveItem(item.productId, item.productName);
                      }}
                      className="p-2 text-text-muted hover:text-brand rounded-full hover:bg-brand-light transition-colors"
                      title="Save for later in Wishlist"
                      aria-label="Save for later"
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRemoveItem(item.productId, item.productName)}
                      className="p-2 text-text-muted hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove from bag"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Impulse Add-Ons Section */}
          {upsells.length > 0 && (
            <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-border/80 shadow-subtle space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <h3 className="font-display font-semibold text-sm sm:text-base text-text-main">
                  Recommended Everyday Add-Ons (Under ₦2,500)
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {upsells.map(up => (
                  <div
                    key={up.id}
                    className="p-3 bg-surface-muted rounded-2xl border border-border/60 flex flex-col justify-between"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-surface">
                      <Image
                        src={up.images?.[0]?.url || ''}
                        alt={up.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-text-main line-clamp-1">
                        {up.name}
                      </h4>
                      <span className="font-bold text-xs text-brand font-sans block mt-0.5">
                        {formatNaira(up.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => addItem(up, 1)}
                      className="mt-2 w-full py-1.5 bg-brand hover:bg-brand-hover text-white rounded-full text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-surface rounded-3xl p-6 border border-border/80 shadow-subtle space-y-5">
            <h3 className="font-display font-bold text-lg text-text-main pb-3 border-b border-border/60">
              Order Summary
            </h3>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-text-body">
                <span>Items Subtotal</span>
                <span className="font-semibold font-sans">{formatNaira(subtotal)}</span>
              </div>

              <div className="flex justify-between text-text-body">
                <span>Estimated Lagos Delivery</span>
                <span className="font-semibold font-sans">
                  {hasFreeShipping ? (
                    <span className="text-emerald-700 font-bold uppercase text-xs">Free</span>
                  ) : (
                    formatNaira(estimatedDelivery)
                  )}
                </span>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Discount ({appliedDiscount.code})
                  </span>
                  <span className="font-sans">-{formatNaira(appliedDiscount.amount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="font-display font-bold text-base text-text-main">
                  Grand Total
                </span>
                <span className="font-display font-bold text-xl sm:text-2xl text-brand font-sans">
                  {formatNaira(grandTotal)}
                </span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2">
              {appliedDiscount ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Coupon {appliedDiscount.code} applied</span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-text-muted hover:text-red-600 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Discount code"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-muted border border-border text-xs text-text-main focus:outline-none focus:border-brand uppercase placeholder:normal-case min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={isCheckingPromo || !promoCode.trim()}
                      className="px-4 py-2.5 bg-surface-muted hover:bg-brand hover:text-white text-text-main font-semibold text-xs rounded-xl border border-border transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {isCheckingPromo ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-red-600 font-medium pl-1">{promoError}</p>
                  )}
                </form>
              )}
            </div>

            {/* Primary Proceed CTA */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 px-6 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Continue Shopping */}
            <Link
              href="/shop"
              className="block text-center text-xs font-semibold text-text-muted hover:text-brand transition-colors"
            >
              ← Continue Shopping
            </Link>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-border/60 space-y-2 text-[11px] text-text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
                <span>Secure Flutterwave payments & Bank Transfer supported</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand flex-shrink-0" />
                <span>Lagos delivery within 24–48 hours in discreet packaging</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routine Enhancement Recommendations */}
      <div className="pt-12 border-t border-border">
        <RecommendedProductsGrid
          context="cart"
          title="Complete Your Care Routine"
          subtitle="Frequently added complementary essentials to enhance your cycle & intimate comfort."
          limit={4}
        />
      </div>
    </div>
  );
}
