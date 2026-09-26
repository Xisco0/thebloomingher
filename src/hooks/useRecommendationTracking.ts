'use client';

import { useEffect, useRef } from 'react';
import { trackClientEvent, addRecentlyViewedProductId } from '@/lib/analytics/session';
import { RecommendationAlgorithm } from '@/types/recommendation.types';

export function useRecommendationTracking() {
  const trackedImpressions = useRef<Set<string>>(new Set());

  const trackImpression = (productId: string, algorithm: RecommendationAlgorithm, context = 'product') => {
    if (!productId || trackedImpressions.current.has(productId)) return;
    trackedImpressions.current.add(productId);

    trackClientEvent('recommendation_impression', {
      productId,
      metadata: { algorithm, context },
    });
  };

  const trackClick = (productId: string, algorithm: RecommendationAlgorithm, context = 'product') => {
    trackClientEvent('recommendation_click', {
      productId,
      metadata: { algorithm, context },
    });
  };

  const trackAddToCart = (productId: string, algorithm: RecommendationAlgorithm, context = 'product') => {
    trackClientEvent('recommendation_add_to_cart', {
      productId,
      metadata: { algorithm, context },
    });
  };

  const trackProductView = (productId: string, categoryId?: string) => {
    if (!productId) return;
    addRecentlyViewedProductId(productId);
    trackClientEvent('product_view', {
      productId,
      categoryId,
    });
  };

  return {
    trackImpression,
    trackClick,
    trackAddToCart,
    trackProductView,
  };
}
