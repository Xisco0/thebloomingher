import { IRecommendationRepository } from '../interfaces';
import {
  Product,
  RecommendationRequest,
  RecommendedProduct,
  ProductRelationship,
  CoPurchaseAssociation,
  AnalyticsEvent,
  RecommendationMetrics,
} from '@/types';
import { cmsStore } from '@/lib/cms-store';
import { SupabaseProductRepository } from './supabase-product.repo';
import { hybridRecommendationEngine } from '@/lib/recommendation/hybrid-engine';

export class SupabaseRecommendationRepository implements IRecommendationRepository {
  private productRepo = new SupabaseProductRepository();

  private async getLiveProducts(): Promise<Product[]> {
    const res = await this.productRepo.getProducts({ pageSize: 250 });
    return res.data;
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendedProduct[]> {
    const allProducts = await this.getLiveProducts();
    const relationships = cmsStore.getRelationships();
    const coPurchases = cmsStore.getCoPurchases();
    const events = cmsStore.getAnalyticsEvents();

    return hybridRecommendationEngine.recommend(request, {
      allProducts,
      relationships,
      coPurchases,
      events,
    });
  }

  async getRelatedProducts(productId: string, categoryId?: string, limit = 4): Promise<Product[]> {
    const recs = await this.getRecommendations({
      context: 'product',
      productId,
      categoryIds: categoryId ? [categoryId] : undefined,
      limit,
    });
    return recs.map(r => r.product);
  }

  async getFrequentlyBoughtTogether(productId: string): Promise<Product[]> {
    const allProducts = await this.getLiveProducts();
    const current = allProducts.find(p => p.id === productId);
    if (!current) return [];

    // Check manual FBT relationships first
    const relationships = cmsStore.getRelationshipsForProduct(productId);
    const manualFbt = relationships
      .filter(r => r.relationship_type === 'frequently_bought_together')
      .map(r => allProducts.find(p => p.id === r.target_product_id))
      .filter(Boolean) as Product[];

    if (manualFbt.length >= 2) {
      return [current, ...manualFbt.slice(0, 2)];
    }

    // Check co-purchase associations calculated from orders
    const coPurchases = cmsStore.getCoPurchases();
    const coPurchasedItems = coPurchases
      .filter(cp => cp.source_product_id === productId)
      .sort((a, b) => b.frequency - a.frequency)
      .map(cp => allProducts.find(p => p.id === cp.target_product_id))
      .filter(Boolean) as Product[];

    const combined = Array.from(new Set([...manualFbt, ...coPurchasedItems]));

    if (combined.length >= 2) {
      return [current, ...combined.slice(0, 2)];
    }

    // Complementary fallback rules
    const complementary = allProducts.filter(p => {
      if (p.id === productId || combined.some(c => c.id === p.id)) return false;
      if (current.category_name?.includes('Pain') || current.category_name?.includes('Menstrual')) {
        return p.name.includes('Herbal Tea') || p.name.includes('Pant Liner') || p.name.includes('Cup');
      }
      return p.price < 10000;
    });

    const finalBundle = [current, ...combined, ...complementary].slice(0, 3);
    return finalBundle;
  }

  async getCartUpsells(categoryIds: string[] = [], limit = 4): Promise<Product[]> {
    const recs = await this.getRecommendations({
      context: 'cart',
      categoryIds,
      limit,
    });
    return recs.map(r => r.product);
  }

  async getRecentlyViewed(productIds: string[], limit = 6): Promise<Product[]> {
    if (!productIds || productIds.length === 0) return [];
    const allProducts = await this.getLiveProducts();
    const map = new Map(allProducts.map(p => [p.id, p]));
    
    // Preserve customer's most recent order
    const result: Product[] = [];
    for (const id of productIds) {
      const p = map.get(id);
      if (p && p.status === 'active') {
        result.push(p);
      }
      if (result.length >= limit) break;
    }
    return result;
  }

  async getProductRelationships(productId?: string): Promise<ProductRelationship[]> {
    const all = cmsStore.getRelationships();
    const products = await this.getLiveProducts();
    const filtered = productId ? all.filter(r => r.source_product_id === productId) : all;

    return filtered.map(r => ({
      ...r,
      target_product: products.find(p => p.id === r.target_product_id),
    }));
  }

  async saveProductRelationship(rel: Partial<ProductRelationship>): Promise<ProductRelationship> {
    return cmsStore.saveRelationship(rel);
  }

  async deleteProductRelationship(id: string): Promise<boolean> {
    return cmsStore.deleteRelationship(id);
  }

  async getCoPurchases(limit = 20): Promise<CoPurchaseAssociation[]> {
    return cmsStore.getCoPurchases().slice(0, limit);
  }

  async trackEvent(eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> {
    return cmsStore.trackEvent(eventData);
  }

  async getRecommendationMetrics(): Promise<RecommendationMetrics> {
    return cmsStore.getRecommendationMetrics();
  }
}

