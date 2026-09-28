import React from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  columns?: 'default' | 'compact' | 'six';
}

export function ProductGrid({
  products,
  isLoading = false,
  emptyMessage = 'No products found.',
  columns = 'default',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-surface rounded-3xl border border-border/80">
        <p className="text-base text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  let colClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  if (columns === 'six') {
    colClass = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
  } else if (columns === 'compact') {
    colClass = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3';
  }

  return (
    <div className={`grid ${colClass} gap-3.5 sm:gap-6`}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
