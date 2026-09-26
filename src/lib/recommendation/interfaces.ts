import { Product } from '@/types/product.types';
import {
  RecommendationRequest,
  RecommendedProduct,
  ProductRelationship,
  CoPurchaseAssociation,
  AnalyticsEvent,
} from '@/types/recommendation.types';

export interface IRecommendationProvider {
  name: string;
  getRecommendations(
    request: RecommendationRequest,
    contextData: {
      allProducts: Product[];
      relationships?: ProductRelationship[];
      coPurchases?: CoPurchaseAssociation[];
      events?: AnalyticsEvent[];
    }
  ): Promise<RecommendedProduct[]>;
}
