'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const isWish = isInWishlist(product.id);
  const primaryImage = product.images?.[0]?.url || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg';

  return (
    <div className="group relative bg-surface rounded-2xl border border-border/80 hover:border-brand/40 overflow-hidden shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
      {/* Top Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-muted">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.is_bestseller && (
            <span className="px-2.5 py-0.5 bg-brand text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
              Bestseller
            </span>
          )}
          {product.price < 10000 && !product.is_bestseller && (
            <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-semibold rounded-full shadow-sm">
              Under ₦10k
            </span>
          )}
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="px-2 py-0.5 bg-gold text-white text-[10px] font-bold rounded-full shadow-sm">
              Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isWish
              ? 'bg-brand text-white'
              : 'bg-white/80 text-text-muted hover:text-brand hover:bg-white shadow-sm'
          }`}
          aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWish ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Body Information */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          {/* Category Subtitle */}
          <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium block">
            {product.category_name}
          </span>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-brand transition-colors">
            <h3 className="font-display font-medium text-sm sm:text-base text-text-main leading-snug line-clamp-2 mt-1">
              {product.name}
            </h3>
          </Link>

          {/* Star Rating */}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-text-muted">
            <div className="flex text-gold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-gold text-gold" />
              ))}
            </div>
            <span className="text-[11px]">({product.rating_count || 12})</span>
          </div>
        </div>

        {/* Price & Add to Cart Button */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg text-brand font-sans">
              {formatNaira(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-text-muted line-through font-sans">
                {formatNaira(product.compare_at_price)}
              </span>
            )}
          </div>

          <button
            onClick={() => addItem(product, 1)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
