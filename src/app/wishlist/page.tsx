'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowRight, Trash2, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { catalogService } from '@/services';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { analytics } from '@/lib/analytics/events';

export default function WishlistPage() {
  const { wishlist, addItem, openCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [movedAll, setMovedAll] = useState(false);

  useEffect(() => {
    async function loadWishlist() {
      if (wishlist.length > 0) {
        const results = await Promise.all(wishlist.map(id => catalogService.getProductById(id)));
        setProducts(results.filter(Boolean) as Product[]);
      } else {
        setProducts([]);
      }
      setLoading(false);
    }
    loadWishlist();
  }, [wishlist]);

  const handleMoveAllToCart = () => {
    products.forEach(prod => {
      if (prod.stock_quantity > 0) {
        addItem(prod, 1);
        analytics.track('add_to_cart', {
          productId: prod.id,
          productName: prod.name,
          productPrice: prod.price,
          source: 'wishlist_move_all',
        });
      }
    });
    setMovedAll(true);
    setTimeout(() => {
      setMovedAll(false);
      openCart();
    }, 1000);
  };

  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      <div className="max-w-2xl mx-auto text-center mb-8 space-y-2">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          Saved Essentials
        </span>
        <h1 className="font-display font-bold text-3xl text-text-main">Your Wishlist</h1>
        <p className="text-sm text-text-muted">
          Keep track of your favorite self-care items and cycle essentials for later.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-muted">Loading your saved items...</div>
      ) : products.length > 0 ? (
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border/80 shadow-subtle">
            <span className="text-xs text-text-muted font-medium">
              You have <strong className="text-text-main">{products.length}</strong> saved items
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleMoveAllToCart}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-full text-xs font-semibold shadow-sm transition-all"
              >
                {movedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Moved to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move All to Bag</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {products.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-3xl p-8 sm:p-14 border border-border text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-display font-semibold text-xl text-text-main">
            Your wishlist is empty
          </h3>
          <p className="text-xs sm:text-sm text-text-muted">
            Tap the heart icon on any product to save it here for later.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-brand-hover transition-colors shadow-sm"
          >
            <span>Explore Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
