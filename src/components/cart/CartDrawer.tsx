'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';
import { recommendationService, catalogService } from '@/services';
import { Product } from '@/types';

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    removeItem,
    updateQuantity,
    subtotal,
    freeShippingThreshold,
    amountUntilFreeShipping,
    hasFreeShipping,
    addItem,
  } = useCart();

  const [upsells, setUpsells] = useState<Product[]>([]);

  useEffect(() => {
    async function loadUpsells() {
      const prods = await recommendationService.getCartUpsells();
      setUpsells(prods);
    }
    loadUpsells();
  }, []);

  // Calculate free delivery progress percentage
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h3 className="font-display font-semibold text-lg text-text-main">
                Your Shopping Bag ({items.length})
              </h3>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-text-muted hover:text-text-main hover:bg-brand-light rounded-full transition-colors"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Free Delivery Progress Bar (₦40,000 threshold) */}
          <div className="bg-brand-light/60 px-5 py-3 border-b border-brand/10">
            <div className="flex justify-between items-center text-xs font-medium mb-1.5 text-text-main">
              {hasFreeShipping ? (
                <span className="text-emerald-700 font-semibold">
                  FREE Lagos Delivery Unlocked!
                </span>
              ) : (
                <span>
                  Add <strong className="text-brand">{formatNaira(amountUntilFreeShipping)}</strong> for Free Delivery
                </span>
              )}
              <span className="text-text-muted">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-brand/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto text-brand">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-text-main text-base">Your bag is empty</h4>
                  <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                    Explore our feminine care, menstrual kits, and daily wellness essentials.
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="inline-block px-6 py-2.5 bg-brand text-white rounded-full text-sm font-medium hover:bg-brand-hover transition-colors"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.productId}
                  className="flex gap-3.5 p-3 rounded-xl bg-surface-muted border border-border/60 hover:border-brand/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
                    <Image
                      src={item.imageUrl || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg'}
                      alt={item.productName}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm text-text-main truncate">
                        {item.productName}
                      </h4>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-text-muted hover:text-red-500 p-1 transition-colors"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-border rounded-lg bg-surface">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 text-text-muted hover:text-brand transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-text-main">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1.5 text-text-muted hover:text-brand transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-semibold text-sm text-brand font-sans">
                        {formatNaira(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* In-Cart Quick Upsell Carousel (< ₦2,500 items) */}
            {items.length > 0 && upsells.length > 0 && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-main mb-3 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span>Frequently Added Essentials</span>
                </div>
                <div className="space-y-2">
                  {upsells.slice(0, 2).map(up => (
                    <div
                      key={up.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-brand-light/40 border border-brand/10 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white flex-shrink-0 border border-border">
                          <Image
                            src={up.images[0]?.url || ''}
                            alt={up.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-main truncate">{up.name}</p>
                          <p className="font-bold text-brand">{formatNaira(up.price)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addItem(up, 1)}
                        className="px-2.5 py-1 bg-brand text-white rounded-md font-medium text-[11px] hover:bg-brand-hover transition-colors flex-shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {items.length > 0 && (
            <div className="p-5 border-t border-border bg-surface space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-text-main">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-muted text-xs">
                  <span>Estimated Lagos Delivery</span>
                  <span>{hasFreeShipping ? 'FREE' : 'Calculated at checkout'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="py-3 px-4 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-full font-semibold text-xs flex items-center justify-center transition-colors"
                >
                  View Full Bag
                </Link>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="py-3 px-4 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-[11px] text-center text-text-muted">
                🔒 Guaranteed safe checkout powered by Paystack (Card, Transfer, USSD)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
