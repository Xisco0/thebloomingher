'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ShoppingBag, ArrowRight, Check, Star } from 'lucide-react';
import { Product } from '@/types/product.types';
import { RecommendedProduct, RecommendationContext } from '@/types/recommendation.types';
import { formatNaira } from '@/lib/utils/currency';
import { useCart } from '@/context/CartContext';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';

interface RecommendedProductsGridProps {
  context: RecommendationContext;
  productId?: string;
  categoryIds?: string[];
  title?: string;
  subtitle?: string;
  limit?: number;
  layout?: 'grid' | 'horizontal';
}

export function RecommendedProductsGrid({
  context,
  productId,
  categoryIds,
  title = 'You May Also Like',
  subtitle = 'Curated recommendations to complement your wellness journey.',
  limit = 4,
  layout = 'grid',
}: RecommendedProductsGridProps) {
  const [items, setItems] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  const { addItem, openCart } = useCart();
  const { trackImpression, trackClick, trackAddToCart } = useRecommendationTracking();

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          context,
          limit: String(limit),
        });
        if (productId) queryParams.set('productId', productId);
        if (categoryIds && categoryIds.length > 0) queryParams.set('categoryIds', categoryIds.join(','));

        const res = await fetch(`/api/recommendations?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && data.recommendations) {
          setItems(data.recommendations);

          // Track impressions
          data.recommendations.forEach((rec: RecommendedProduct) => {
            trackImpression(rec.product.id, rec.algorithm, context);
          });
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [context, productId, categoryIds?.join(','), limit]);

  if (loading) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-6 w-48 bg-surface-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-64 bg-surface-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const handleAddToCart = (product: Product, algorithm: any) => {
    addItem(product, 1);
    trackAddToCart(product.id, algorithm, context);

    setAddedId(product.id);
    setTimeout(() => {
      setAddedId(null);
      openCart();
    }, 600);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-brand-light text-brand flex items-center justify-center text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              Recommended Care
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main">{title}</h2>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>

        <Link
          href="/shop"
          className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Explore all products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6'
            : 'flex gap-4 overflow-x-auto pb-4 scrollbar-none'
        }
      >
        {items.map(item => {
          const prod = item.product;
          const isAdded = addedId === prod.id;
          const imgSrc =
            (typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url) ||
            '/images/logo.jpg';

          return (
            <div
              key={prod.id}
              className={`bg-surface rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all flex flex-col justify-between overflow-hidden group ${
                layout === 'horizontal' ? 'w-56 flex-shrink-0' : ''
              }`}
            >
              <div>
                {/* Image */}
                <Link
                  href={`/products/${prod.slug}`}
                  onClick={() => trackClick(prod.id, item.algorithm, context)}
                  className="block relative aspect-square bg-surface-muted overflow-hidden"
                >
                  <Image
                    src={imgSrc}
                    alt={prod.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Recommendation Reason Pill */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/90 backdrop-blur-xs text-brand border border-brand/20 shadow-xs line-clamp-1">
                      {item.reason}
                    </span>
                  </div>
                </Link>

                {/* Body Details */}
                <div className="p-3.5 sm:p-4 space-y-1.5">
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block">
                    {prod.category_name}
                  </span>

                  <Link
                    href={`/products/${prod.slug}`}
                    onClick={() => trackClick(prod.id, item.algorithm, context)}
                    className="font-display font-bold text-xs sm:text-sm text-text-main hover:text-brand transition-colors line-clamp-2 block leading-snug"
                  >
                    {prod.name}
                  </Link>

                  <div className="flex items-center gap-1 text-amber-500 pt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold text-text-main">{prod.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-text-muted">({prod.rating_count})</span>
                  </div>
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="p-3.5 sm:p-4 pt-0 space-y-2.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-sm sm:text-base text-text-main">
                    {formatNaira(prod.price)}
                  </span>
                  {prod.compare_at_price && (
                    <span className="text-[10px] text-text-muted line-through">
                      {formatNaira(prod.compare_at_price)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(prod, item.algorithm)}
                  disabled={prod.stock_quantity <= 0}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : prod.stock_quantity <= 0
                      ? 'bg-surface-muted text-text-muted cursor-not-allowed'
                      : 'bg-brand-light hover:bg-brand text-brand hover:text-white border border-brand/20'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : prod.stock_quantity <= 0 ? (
                    <span>Out of stock</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
