import { recommendationRepository } from '@/repositories';
import {
  Product,
  RecommendationRequest,
  RecommendedProduct,
  ProductRelationship,
  CoPurchaseAssociation,
  AnalyticsEvent,
  RecommendationMetrics,
} from '@/types';

export class RecommendationService {
  async getRecommendations(request: RecommendationRequest): Promise<RecommendedProduct[]> {
    return recommendationRepository.getRecommendations(request);
  }

  async getRelatedProducts(productId: string, categoryId?: string, limit = 4): Promise<Product[]> {
    return recommendationRepository.getRelatedProducts(productId, categoryId, limit);
  }

  async getFrequentlyBoughtTogether(productId: string): Promise<Product[]> {
    return recommendationRepository.getFrequentlyBoughtTogether(productId);
  }

  async getCartUpsells(categoryIds: string[] = [], limit = 4): Promise<Product[]> {
    return recommendationRepository.getCartUpsells(categoryIds, limit);
  }

  async getRecentlyViewed(productIds: string[], limit = 6): Promise<Product[]> {
    return recommendationRepository.getRecentlyViewed(productIds, limit);
  }

  async getProductRelationships(productId?: string): Promise<ProductRelationship[]> {
    return recommendationRepository.getProductRelationships(productId);
  }

  async saveProductRelationship(rel: Partial<ProductRelationship>): Promise<ProductRelationship> {
    return recommendationRepository.saveProductRelationship(rel);
  }

  async deleteProductRelationship(id: string): Promise<boolean> {
    return recommendationRepository.deleteProductRelationship(id);
  }

  async getCoPurchases(limit = 20): Promise<CoPurchaseAssociation[]> {
    return recommendationRepository.getCoPurchases(limit);
  }

  async trackEvent(eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> {
    return recommendationRepository.trackEvent(eventData);
  }

  async getRecommendationMetrics(): Promise<RecommendationMetrics> {
    return recommendationRepository.getRecommendationMetrics();
  }
}

export const recommendationService = new RecommendationService();
