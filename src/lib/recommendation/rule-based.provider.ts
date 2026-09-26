import { IRecommendationProvider } from './interfaces';
import { Product } from '@/types/product.types';
import {
  RecommendationRequest,
  RecommendedProduct,
  RecommendationAlgorithm,
} from '@/types/recommendation.types';

export class RuleBasedRecommendationProvider implements IRecommendationProvider {
  name = 'RuleBasedRecommendationProvider';

  // Scoring Weights Configuration
  private readonly WEIGHT_MANUAL_RELATIONSHIP = 50;
  private readonly WEIGHT_CO_PURCHASE = 40;
  private readonly WEIGHT_SAME_CATEGORY = 25;
  private readonly WEIGHT_SHARED_TAG = 10;
  private readonly MAX_TAG_SCORE = 30;
  private readonly WEIGHT_COMPLEMENTARY_ROUTINE = 20;
  private readonly WEIGHT_SIMILAR_PRICE_BAND = 5;
  private readonly WEIGHT_BESTSELLER_POPULARITY = 15;
  private readonly WEIGHT_NEW_ARRIVAL = 5;

  // Domain-specific complementary matrix for women's health & intimate care
  private readonly complementaryRules: Record<string, string[]> = {
    // Menstrual care -> liners, pain relief, wipes, cups
    'cat-menstrual-care': ['cat-pain-relief-comfort', 'cat-intimate-hygiene', 'cat-on-the-go-essentials'],
    // Pain relief -> herbal tea, comfort belts, warm water bottles
    'cat-pain-relief-comfort': ['cat-menstrual-care', 'cat-health-supplements'],
    // Intimate hygiene -> pant liners, washes, wipes
    'cat-intimate-hygiene': ['cat-menstrual-care', 'cat-on-the-go-essentials'],
    // Health & supplements -> herbal teas, gummies, comfort items
    'cat-health-supplements': ['cat-pain-relief-comfort', 'cat-intimate-hygiene'],
    // On-the-go -> wipes, disposable seat covers, mini packs
    'cat-on-the-go-essentials': ['cat-menstrual-care', 'cat-intimate-hygiene'],
  };

  async getRecommendations(
    request: RecommendationRequest,
    contextData: {
      allProducts: Product[];
      relationships?: any[];
      coPurchases?: any[];
      events?: any[];
    }
  ): Promise<RecommendedProduct[]> {
    const { allProducts, relationships = [], coPurchases = [] } = contextData;
    const { productId, categoryIds = [], excludeProductIds = [], limit = 4 } = request;

    // Filter candidate products: Must be active and not in exclude list
    const candidateProducts = allProducts.filter(p => {
      if (productId && p.id === productId) return false;
      if (excludeProductIds.includes(p.id)) return false;
      if (p.status !== 'active') return false;
      // In cart/checkout contexts, exclude out-of-stock items
      if (request.context === 'cart' || request.context === 'checkout') {
        if (p.stock_quantity <= 0) return false;
      }
      return true;
    });

    const targetProduct = productId ? allProducts.find(p => p.id === productId) : null;

    // Calculate score for each candidate
    const scoredCandidates: RecommendedProduct[] = candidateProducts.map(candidate => {
      let score = 0;
      let primaryReason = 'Recommended for you';
      let algorithm: RecommendationAlgorithm = 'category_tag_rule';

      // 1. Manual Admin Relationship Match (+50)
      if (productId) {
        const manualRel = relationships.find(
          r =>
            r.is_active &&
            r.source_product_id === productId &&
            r.target_product_id === candidate.id
        );

        if (manualRel) {
          score += this.WEIGHT_MANUAL_RELATIONSHIP + (manualRel.priority_weight || 0) * 0.2;
          primaryReason =
            manualRel.relationship_type === 'frequently_bought_together'
              ? 'Frequently bought together'
              : manualRel.relationship_type === 'complementary'
              ? 'Complete your care routine'
              : 'Pair with this item';
          algorithm = 'manual_override';
        }
      }

      // 2. Co-Purchase Association from Orders (+40)
      if (productId) {
        const coPurchase = coPurchases.find(
          cp =>
            (cp.source_product_id === productId && cp.target_product_id === candidate.id) ||
            (cp.source_product_id === candidate.id && cp.target_product_id === productId)
        );

        if (coPurchase) {
          const coPurchaseScore = Math.min(this.WEIGHT_CO_PURCHASE, coPurchase.frequency * 8);
          score += coPurchaseScore;
          if (algorithm !== 'manual_override') {
            primaryReason = 'Frequently purchased together by Nigerian shoppers';
            algorithm = 'co_purchase_association';
          }
        }
      }

      // 3. Category Similarity (+25)
      if (targetProduct && candidate.category_id === targetProduct.category_id) {
        score += this.WEIGHT_SAME_CATEGORY;
        if (score <= this.WEIGHT_SAME_CATEGORY) {
          primaryReason = `Popular in ${targetProduct.category_name || 'this category'}`;
          algorithm = 'category_tag_rule';
        }
      } else if (categoryIds.length > 0 && candidate.category_id && categoryIds.includes(candidate.category_id)) {
        score += this.WEIGHT_SAME_CATEGORY;
        primaryReason = 'Matches your active cart items';
        algorithm = 'complementary_routine';
      }

      // 4. Shared Tags (+10 each, capped at +30)
      if (targetProduct && targetProduct.tags && candidate.tags) {
        const matchingTags = candidate.tags.filter(t =>
          targetProduct.tags.some(targetTag => targetTag.toLowerCase() === t.toLowerCase())
        );
        const tagScore = Math.min(this.MAX_TAG_SCORE, matchingTags.length * this.WEIGHT_SHARED_TAG);
        score += tagScore;
      }

      // 5. Cross-Category Complementary Routine (+20)
      if (targetProduct && targetProduct.category_id && candidate.category_id) {
        const complementaryTargets = this.complementaryRules[targetProduct.category_id] || [];
        if (complementaryTargets.includes(candidate.category_id)) {
          score += this.WEIGHT_COMPLEMENTARY_ROUTINE;
          if (score <= this.WEIGHT_COMPLEMENTARY_ROUTINE + this.WEIGHT_BESTSELLER_POPULARITY) {
            primaryReason = 'Routine enhancement';
            algorithm = 'complementary_routine';
          }
        }
      }

      // 6. Price Band Match (+5)
      if (targetProduct && targetProduct.price > 0) {
        const priceRatio = candidate.price / targetProduct.price;
        if (priceRatio >= 0.7 && priceRatio <= 1.3) {
          score += this.WEIGHT_SIMILAR_PRICE_BAND;
        }
      }

      // 7. Popularity / Bestseller Boost (+15)
      if (candidate.is_bestseller) {
        score += this.WEIGHT_BESTSELLER_POPULARITY;
      }
      if (candidate.rating >= 4.8 && candidate.rating_count >= 5) {
        score += 5;
      }

      // 8. New Arrival Boost (+5)
      if (candidate.is_new_arrival) {
        score += this.WEIGHT_NEW_ARRIVAL;
      }

      return {
        product: candidate,
        score,
        reason: primaryReason,
        algorithm,
      };
    });

    // Sort by score descending and return top requested limit
    scoredCandidates.sort((a, b) => b.score - a.score);

    return scoredCandidates.slice(0, limit);
  }
}
