'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { History, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '@/types/product.types';
import { formatNaira } from '@/lib/utils/currency';
import { getRecentlyViewedProductIds } from '@/lib/analytics/session';
import { useCart } from '@/context/CartContext';

interface RecentlyViewedSectionProps {
  currentProductId?: string;
  limit?: number;
}

export function RecentlyViewedSection({
  currentProductId,
  limit = 4,
}: RecentlyViewedSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    async function loadRecentlyViewed() {
      const storedIds = getRecentlyViewedProductIds();
      // Exclude current product if viewing PDP
      const targetIds = currentProductId
        ? storedIds.filter(id => id !== currentProductId)
        : storedIds;

      if (targetIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/recommendations?context=recently_viewed&productIds=${targetIds.slice(0, limit).join(',')}&limit=${limit}`
        );
        const data = await res.json();
        if (data.success && data.recommendations) {
          setProducts(data.recommendations.map((r: any) => r.product));
        }
      } catch (err) {
        console.error('Failed to load recently viewed products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecentlyViewed();
  }, [currentProductId, limit]);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-surface-muted text-text-muted flex items-center justify-center text-xs">
            <History className="w-3.5 h-3.5" />
          </span>
          <h2 className="font-display font-bold text-lg sm:text-xl text-text-main">
            Recently Viewed by You
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        {products.map(prod => {
          const imgSrc =
            (typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url) ||
            '/images/logo.jpg';

          return (
            <div
              key={prod.id}
              className="bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <Link
                  href={`/products/${prod.slug}`}
                  className="block relative aspect-square bg-surface-muted overflow-hidden"
                >
                  <Image
                    src={imgSrc}
                    alt={prod.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="p-3.5 space-y-1">
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block truncate">
                    {prod.category_name}
                  </span>
                  <Link
                    href={`/products/${prod.slug}`}
                    className="font-display font-bold text-xs text-text-main hover:text-brand transition-colors line-clamp-1"
                  >
                    {prod.name}
                  </Link>
                  <p className="font-display font-bold text-xs sm:text-sm text-text-main">
                    {formatNaira(prod.price)}
                  </p>
                </div>
              </div>

              <div className="p-3.5 pt-0">
                <button
                  onClick={() => {
                    addItem(prod, 1);
                    openCart();
                  }}
                  disabled={prod.stock_quantity <= 0}
                  className="w-full py-1.5 px-2.5 bg-surface-muted hover:bg-brand-light text-text-body hover:text-brand text-xs font-semibold rounded-xl border border-border transition-colors flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>{prod.stock_quantity <= 0 ? 'Out of stock' : 'Add to Bag'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
