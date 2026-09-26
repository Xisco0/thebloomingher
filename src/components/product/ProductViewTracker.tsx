'use client';

import { useEffect } from 'react';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';

interface ProductViewTrackerProps {
  productId: string;
  categoryId?: string | null;
}

export function ProductViewTracker({ productId, categoryId }: ProductViewTrackerProps) {
  const { trackProductView } = useRecommendationTracking();

  useEffect(() => {
    if (productId) {
      trackProductView(productId, categoryId || undefined);
    }
  }, [productId, categoryId]);

  return null;
}
