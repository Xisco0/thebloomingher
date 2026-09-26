'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';
import { analytics } from '@/lib/analytics/events';

interface StickyMobileBuyBarProps {
  product: Product;
}

export function StickyMobileBuyBar({ product }: StickyMobileBuyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once user has scrolled past 480px (past hero buy box on mobile)
      if (window.scrollY > 480) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const primaryImage = product.images?.[0]?.url || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg';
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem(product, 1);
    setAdded(true);
    analytics.track('add_to_cart', {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      quantity: 1,
      source: 'sticky_bar',
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border/80 shadow-2xl p-3 sm:hidden animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0 border border-border">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-xs text-text-main truncate">
              {product.name}
            </span>
            <span className="font-bold text-xs text-brand font-sans">
              {formatNaira(product.price)}
            </span>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-md active:scale-95 transition-all flex-shrink-0 ${
            isOutOfStock
              ? 'bg-surface-muted text-text-muted'
              : added
              ? 'bg-emerald-700'
              : 'bg-brand'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>Added</span>
            </>
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
}
