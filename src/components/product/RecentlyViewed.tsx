'use client';

import React, { useEffect, useState } from 'react';
import { catalogService } from '@/services';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface RecentlyViewedProps {
  currentProductId?: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tbh_recently_viewed');
      let ids: string[] = stored ? JSON.parse(stored) : [];

      if (currentProductId) {
        // Add current product to front, deduplicate, limit to 6
        ids = [currentProductId, ...ids.filter(id => id !== currentProductId)].slice(0, 6);
        localStorage.setItem('tbh_recently_viewed', JSON.stringify(ids));
      }

      // Filter out current product for the display list
      const displayIds = ids.filter(id => id !== currentProductId).slice(0, 4);

      if (displayIds.length > 0) {
        Promise.all(displayIds.map(id => catalogService.getProductById(id))).then(prods => {
          setRecentProducts(prods.filter(Boolean) as Product[]);
        });
      }
    } catch (e) {
      console.error('Failed to load recently viewed products', e);
    }
  }, [currentProductId]);

  if (recentProducts.length === 0) return null;

  return (
    <section className="pt-12 border-t border-border my-10">
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            Your History
          </span>
          <h3 className="font-display font-semibold text-xl sm:text-2xl text-text-main">
            Recently Viewed
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recentProducts.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
