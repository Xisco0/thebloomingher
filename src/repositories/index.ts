import { SupabaseProductRepository } from './supabase/supabase-product.repo';
import { SupabaseCategoryRepository } from './supabase/supabase-category.repo';
import { SupabaseOrderRepository } from './supabase/supabase-order.repo';
import { SupabaseRecommendationRepository } from './supabase/supabase-recommendation.repo';
import { SupabaseCMSRepository } from './supabase/supabase-cms.repo';
import {
  IProductRepository,
  ICategoryRepository,
  IOrderRepository,
  IRecommendationRepository,
  ICMSRepository
} from './interfaces';

// In Phase 1, instantiate Supabase repositories
// In future Phase, simply swap these instances for LaravelProductRepository, etc.
export const productRepository: IProductRepository = new SupabaseProductRepository();
export const categoryRepository: ICategoryRepository = new SupabaseCategoryRepository();
export const orderRepository: IOrderRepository = new SupabaseOrderRepository();
export const recommendationRepository: IRecommendationRepository = new SupabaseRecommendationRepository();
export const cmsRepository: ICMSRepository = new SupabaseCMSRepository();

export * from './interfaces';
