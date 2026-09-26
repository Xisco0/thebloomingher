import { Product } from './product.types';

export type AnalyticsEventType =
  | 'product_view'
  | 'product_search'
  | 'category_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'purchase'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'recommendation_impression'
  | 'recommendation_click'
  | 'recommendation_add_to_cart';

export interface AnalyticsEvent {
  id: string;
  event_type: AnalyticsEventType;
  user_id?: string | null;
  anonymous_session_id: string;
  product_id?: string | null;
  category_id?: string | null;
  search_query?: string | null;
  order_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export type ProductRelationshipType =
  | 'related'
  | 'frequently_bought_together'
  | 'complementary'
  | 'alternative';

export interface ProductRelationship {
  id: string;
  source_product_id: string;
  target_product_id: string;
  relationship_type: ProductRelationshipType;
  priority_weight: number; // 1 to 100
  is_active: boolean;
  is_manual: boolean;
  created_at: string;
  target_product?: Product;
}

export interface CoPurchaseAssociation {
  source_product_id: string;
  source_product_name?: string;
  target_product_id: string;
  target_product_name?: string;
  frequency: number;
  confidence_score: number; // 0.0 to 1.0
  last_occurred_at: string;
}

export type RecommendationContext =
  | 'product'
  | 'cart'
  | 'homepage'
  | 'checkout'
  | 'category'
  | 'personalized'
  | 'recently_viewed';

export interface RecommendationRequest {
  context: RecommendationContext;
  productId?: string;
  categoryIds?: string[];
  userId?: string;
  sessionId?: string;
  limit?: number;
  excludeProductIds?: string[];
}

export type RecommendationAlgorithm =
  | 'manual_override'
  | 'co_purchase_association'
  | 'category_tag_rule'
  | 'personalized_affinity'
  | 'complementary_routine'
  | 'popularity_fallback';

export interface RecommendedProduct {
  product: Product;
  score: number;
  reason: string;
  algorithm: RecommendationAlgorithm;
}

export interface RecommendationResult {
  items: RecommendedProduct[];
  context: RecommendationContext;
  total: number;
}

export interface RecommendationMetrics {
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
  totalCartAdds: number;
  conversionRate: number;
}
