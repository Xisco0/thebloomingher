'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, MessageCircle, Plus, Minus, Check, ShieldCheck } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { useCart } from '@/context/CartContext';
import { generateWhatsAppOrderLink } from '@/lib/utils/whatsapp';
import { formatNaira } from '@/lib/utils/currency';
import { analytics } from '@/lib/analytics/events';

interface ProductBuyActionsProps {
  product: Product;
}

export function ProductBuyActions({ product }: ProductBuyActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCart();
  const router = useRouter();

  // Dynamic price based on variant or base
  const effectivePrice = selectedVariant?.price_override ?? product.price;
  const effectiveStock = selectedVariant?.stock_quantity ?? product.stock_quantity;
  const isOutOfStock = effectiveStock <= 0;

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    analytics.track('product_variant_selected', {
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantTitle: variant.title,
      productPrice: variant.price_override ?? product.price,
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // Create item payload with variant consideration
    const productPayload = {
      ...product,
      price: effectivePrice,
      name: selectedVariant ? `${product.name} - ${selectedVariant.title}` : product.name,
      sku: selectedVariant ? selectedVariant.sku : product.sku,
      stock_quantity: effectiveStock,
    };

    addItem(productPayload, quantity);
    setAdded(true);

    analytics.track('add_to_cart', {
      productId: product.id,
      productName: productPayload.name,
      productPrice: effectivePrice,
      quantity,
      variantTitle: selectedVariant?.title,
      sku: productPayload.sku,
    });

    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    const productPayload = {
      ...product,
      price: effectivePrice,
      name: selectedVariant ? `${product.name} - ${selectedVariant.title}` : product.name,
      sku: selectedVariant ? selectedVariant.sku : product.sku,
      stock_quantity: effectiveStock,
    };

    addItem(productPayload, quantity);

    analytics.track('buy_now', {
      productId: product.id,
      productName: productPayload.name,
      productPrice: effectivePrice,
      quantity,
      variantTitle: selectedVariant?.title,
    });

    router.push('/checkout');
  };

  const whatsappUrl = generateWhatsAppOrderLink(
    selectedVariant ? `${product.name} (${selectedVariant.title})` : product.name,
    effectivePrice * quantity
  );

  return (
    <div className="space-y-5 pt-2">
      {/* Product Variants (if available) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted block">
            Select Option / Pack Size:
          </label>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map(variant => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleVariantSelect(variant)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'border-brand bg-brand-light text-brand shadow-sm ring-1 ring-brand'
                      : 'border-border bg-surface text-text-main hover:border-brand/40'
                  }`}
                >
                  <span>{variant.title}</span>
                  {variant.price_override && (
                    <span className="ml-1.5 opacity-80 font-sans">
                      ({formatNaira(variant.price_override)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Stepper & Add to Bag */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Stepper */}
        <div className="flex items-center justify-between border border-border rounded-full bg-surface p-1.5 sm:w-36">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:bg-brand-light transition-colors disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm text-text-main font-sans px-2">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
            disabled={isOutOfStock || quantity >= effectiveStock}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-brand hover:bg-brand-light transition-colors disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Add to Bag Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 py-3.5 px-6 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] ${
            isOutOfStock
              ? 'bg-surface-muted text-text-muted border border-border cursor-not-allowed'
              : added
              ? 'bg-emerald-700 text-white'
              : 'bg-brand hover:bg-brand-hover text-white'
          }`}
        >
          {isOutOfStock ? (
            <span>Out of Stock</span>
          ) : added ? (
            <>
              <Check className="w-5 h-5 text-emerald-200" />
              <span>Added to Bag!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Bag • {formatNaira(effectivePrice * quantity)}</span>
            </>
          )}
        </button>
      </div>

      {/* Buy Now & WhatsApp Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-1 py-3 px-6 bg-surface hover:bg-brand-light text-brand border border-brand/30 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>Buy Now (Instant Checkout)</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4 fill-white text-transparent" />
          <span>Order on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
