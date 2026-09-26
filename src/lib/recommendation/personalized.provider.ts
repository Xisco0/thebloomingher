import { IRecommendationProvider } from './interfaces';
import { Product } from '@/types/product.types';
import {
  RecommendationRequest,
  RecommendedProduct,
  AnalyticsEvent,
} from '@/types/recommendation.types';

export class PersonalizedAffinityProvider implements IRecommendationProvider {
  name = 'PersonalizedAffinityProvider';

  async getRecommendations(
    request: RecommendationRequest,
    contextData: {
      allProducts: Product[];
      events?: AnalyticsEvent[];
    }
  ): Promise<RecommendedProduct[]> {
    const { allProducts, events = [] } = contextData;
    const { sessionId, userId, excludeProductIds = [], limit = 4 } = request;

    // Filter customer's relevant events
    const customerEvents = events.filter(
      e =>
        (userId && e.user_id === userId) ||
        (sessionId && e.anonymous_session_id === sessionId)
    );

    if (customerEvents.length === 0) {
      return [];
    }

    // Build category & tag affinity score map from actions
    const categoryAffinities: Record<string, number> = {};
    const tagAffinities: Record<string, number> = {};
    const viewedProductIds = new Set<string>();

    customerEvents.forEach(e => {
      // Event weights
      let weight = 1;
      if (e.event_type === 'product_view') weight = 2;
      if (e.event_type === 'category_view') weight = 2;
      if (e.event_type === 'product_search') weight = 3;
      if (e.event_type === 'wishlist_add') weight = 4;
      if (e.event_type === 'add_to_cart') weight = 5;

      if (e.category_id) {
        categoryAffinities[e.category_id] = (categoryAffinities[e.category_id] || 0) + weight;
      }

      if (e.product_id) {
        viewedProductIds.add(e.product_id);
        const prod = allProducts.find(p => p.id === e.product_id);
        if (prod) {
          if (prod.category_id) {
            categoryAffinities[prod.category_id] = (categoryAffinities[prod.category_id] || 0) + weight;
          }
          prod.tags?.forEach(tag => {
            tagAffinities[tag.toLowerCase()] = (tagAffinities[tag.toLowerCase()] || 0) + weight;
          });
        }
      }

      if (e.search_query) {
        const terms = e.search_query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        terms.forEach(term => {
          tagAffinities[term] = (tagAffinities[term] || 0) + 3;
        });
      }
    });

    // Score active products against the customer's affinity vector
    const candidates = allProducts.filter(p => {
      if (p.status !== 'active') return false;
      if (excludeProductIds.includes(p.id)) return false;
      return true;
    });

    const scored: RecommendedProduct[] = candidates.map(product => {
      let score = 0;

      // Category match
      if (product.category_id && categoryAffinities[product.category_id]) {
        score += categoryAffinities[product.category_id] * 4;
      }

      // Tag & search terms match
      product.tags?.forEach(tag => {
        const lower = tag.toLowerCase();
        if (tagAffinities[lower]) {
          score += tagAffinities[lower] * 2;
        }
      });

      // Popularity booster
      if (product.is_bestseller) score += 5;
      if (product.is_featured) score += 3;

      // Penalize items already purchased or heavily viewed to promote discovery
      if (viewedProductIds.has(product.id)) {
        score += 2; // mild interest boost rather than overwhelming
      }

      return {
        product,
        score,
        reason: 'Selected based on your wellness interests & browsing history',
        algorithm: 'personalized_affinity',
      };
    });

    // Filter candidates that received a non-zero affinity score
    const personalized = scored.filter(item => item.score > 5);
    personalized.sort((a, b) => b.score - a.score);

    return personalized.slice(0, limit);
  }
}
