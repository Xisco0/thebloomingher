'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { Product } from '@/types/product.types';
import { formatNaira } from '@/lib/utils/currency';
import { useCart } from '@/context/CartContext';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
}

export function FrequentlyBoughtTogether({ currentProduct }: FrequentlyBoughtTogetherProps) {
  const [bundleProducts, setBundleProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const { addItem, openCart } = useCart();
  const { trackImpression, trackAddToCart, trackClick } = useRecommendationTracking();

  useEffect(() => {
    async function loadFbt() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recommendations?context=product&productId=${currentProduct.id}&limit=2`);
        const data = await res.json();
        if (data.success && data.recommendations) {
          const recProducts = data.recommendations.map((r: any) => r.product);
          // Bundle includes current product + 1 or 2 complementary items
          const fullBundle = [currentProduct, ...recProducts.filter((p: Product) => p.id !== currentProduct.id)];
          setBundleProducts(fullBundle);
          setSelectedIds(fullBundle.map(p => p.id));

          // Track impressions for recommendation analytics
          recProducts.forEach((p: Product) => {
            trackImpression(p.id, 'co_purchase_association', 'frequently_bought_together');
          });
        }
      } catch (err) {
        console.error('Failed to load frequently bought together:', err);
      } finally {
        setLoading(false);
      }
    }

    if (currentProduct.id) {
      loadFbt();
    }
  }, [currentProduct.id]);

  if (loading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-border/80 flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (bundleProducts.length < 2) {
    return null;
  }

  const selectedProducts = bundleProducts.filter(p => selectedIds.includes(p.id));
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalComparePrice = selectedProducts.reduce(
    (sum, p) => sum + (p.compare_at_price || p.price),
    0
  );
  const hasSavings = totalComparePrice > totalPrice;

  const toggleProduct = (id: string) => {
    // Keep at least current product selected
    if (id === currentProduct.id && selectedIds.includes(id) && selectedIds.length > 1) {
      // allow deselecting
    }
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(prev => prev.filter(i => i !== id));
      }
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleAddBundleToCart = () => {
    selectedProducts.forEach(prod => {
      addItem(prod, 1);

      if (prod.id !== currentProduct.id) {
        trackAddToCart(prod.id, 'co_purchase_association', 'frequently_bought_together');
      }
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border/80 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center text-brand">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-text-main">
              Frequently Bought Together
            </h3>
            <p className="text-xs text-text-muted">
              Combine essential care items for complete daily comfort & savings.
            </p>
          </div>
        </div>
      </div>

      {/* Product Thumbnails with Plus signs */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {bundleProducts.map((prod, idx) => {
          const isSelected = selectedIds.includes(prod.id);
          const imgSrc =
            (typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url) ||
            '/images/logo.jpg';

          return (
            <React.Fragment key={prod.id}>
              {idx > 0 && (
                <div className="w-6 h-6 rounded-full bg-surface-muted border border-border flex items-center justify-center text-text-muted">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                onClick={() => toggleProduct(prod.id)}
                className={`relative group cursor-pointer w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-brand shadow-sm scale-105'
                    : 'border-border/60 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={imgSrc} alt={prod.name} fill className="object-cover" />
                <div
                  className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-brand text-white shadow-xs' : 'bg-surface/80 text-transparent border border-border'
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Item Checkboxes & Price Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border/60 items-center">
        <div className="lg:col-span-2 space-y-2.5">
          {bundleProducts.map(prod => {
            const isSelected = selectedIds.includes(prod.id);
            const isCurrent = prod.id === currentProduct.id;

            return (
              <label
                key={prod.id}
                className="flex items-start gap-2.5 text-xs text-text-body cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProduct(prod.id)}
                  className="mt-0.5 w-4 h-4 rounded text-brand focus:ring-brand border-border"
                />
                <span className="flex-1 leading-snug">
                  {isCurrent && <span className="font-bold text-brand mr-1">[This item]:</span>}
                  <Link
                    href={`/products/${prod.slug}`}
                    onClick={() => trackClick(prod.id, 'co_purchase_association', 'frequently_bought_together')}
                    className="hover:text-brand transition-colors font-medium"
                  >
                    {prod.name}
                  </Link>
                  <span className="font-display font-bold text-text-main ml-2">
                    {formatNaira(prod.price)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {/* CTA Box */}
        <div className="bg-brand/5 border border-brand/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] text-text-muted block uppercase font-bold tracking-wider">
              Total Bundle Price ({selectedProducts.length} items):
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display font-bold text-xl sm:text-2xl text-brand">
                {formatNaira(totalPrice)}
              </span>
              {hasSavings && (
                <span className="text-xs text-text-muted line-through">
                  {formatNaira(totalComparePrice)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddBundleToCart}
            disabled={selectedProducts.length === 0}
            className="w-full py-2.5 px-4 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Bundle Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add Selected to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
