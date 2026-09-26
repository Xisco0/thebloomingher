import { IRecommendationProvider } from './interfaces';
import { RuleBasedRecommendationProvider } from './rule-based.provider';
import { PersonalizedAffinityProvider } from './personalized.provider';
import { Product } from '@/types/product.types';
import {
  RecommendationRequest,
  RecommendedProduct,
  ProductRelationship,
  CoPurchaseAssociation,
  AnalyticsEvent,
} from '@/types/recommendation.types';

export class HybridRecommendationEngine {
  private ruleProvider: IRecommendationProvider;
  private personalizedProvider: IRecommendationProvider;

  constructor() {
    this.ruleProvider = new RuleBasedRecommendationProvider();
    this.personalizedProvider = new PersonalizedAffinityProvider();
  }

  async recommend(
    request: RecommendationRequest,
    contextData: {
      allProducts: Product[];
      relationships?: ProductRelationship[];
      coPurchases?: CoPurchaseAssociation[];
      events?: AnalyticsEvent[];
    }
  ): Promise<RecommendedProduct[]> {
    const { allProducts, relationships = [], coPurchases = [], events = [] } = contextData;
    const { context, limit = 4, excludeProductIds = [], productId } = request;

    let results: RecommendedProduct[] = [];
    const seenIds = new Set<string>([...excludeProductIds, ...(productId ? [productId] : [])]);

    // 1. Personalized Context or Homepage
    if (context === 'personalized' || context === 'homepage') {
      const personalizedResults = await this.personalizedProvider.getRecommendations(request, {
        allProducts,
        events,
      });

      for (const item of personalizedResults) {
        if (!seenIds.has(item.product.id)) {
          results.push(item);
          seenIds.add(item.product.id);
        }
        if (results.length >= limit) break;
      }
    }

    // 2. Rule-Based & Manual Relationships (Product, Cart, Checkout, or as secondary)
    if (results.length < limit) {
      const ruleResults = await this.ruleProvider.getRecommendations(request, {
        allProducts,
        relationships,
        coPurchases,
        events,
      });

      for (const item of ruleResults) {
        if (!seenIds.has(item.product.id)) {
          results.push(item);
          seenIds.add(item.product.id);
        }
        if (results.length >= limit) break;
      }
    }

    // 3. Robust Cold-Start Fallback (Never show empty sections)
    if (results.length < limit) {
      const bestSellers = allProducts
        .filter(p => p.status === 'active' && !seenIds.has(p.id))
        .sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0) || (b.rating_count || 0) - (a.rating_count || 0));

      for (const p of bestSellers) {
        results.push({
          product: p,
          score: 10,
          reason: 'Customer favorite in Nigeria',
          algorithm: 'popularity_fallback',
        });
        seenIds.add(p.id);
        if (results.length >= limit) break;
      }
    }

    return results.slice(0, limit);
  }
}

export const hybridRecommendationEngine = new HybridRecommendationEngine();
