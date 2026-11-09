'use client';

import { useEffect } from 'react';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';
import { analytics } from '@/lib/analytics/events';

interface ProductViewTrackerProps {
  productId: string;
  categoryId?: string | null;
  product?: {
    id?: string;
    name?: string;
    price?: number;
    category_name?: string | null;
    sku?: string;
  };
}

export function ProductViewTracker({ productId, categoryId, product }: ProductViewTrackerProps) {
  const { trackProductView } = useRecommendationTracking();

  useEffect(() => {
    if (productId) {
      trackProductView(productId, categoryId || undefined);

      if (product) {
        analytics.track('product_view', {
          productId,
          productName: product.name,
          productPrice: product.price,
          categoryName: product.category_name || categoryId || undefined,
          sku: product.sku,
        });
      }
    }
  }, [productId, categoryId, product]);

  return null;
}
