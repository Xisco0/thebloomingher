import { productRepository, categoryRepository } from '@/repositories';
import { Product, Category, ProductFilterOptions, PaginatedResult } from '@/types';

export class CatalogService {
  async getProducts(options?: ProductFilterOptions): Promise<PaginatedResult<Product>> {
    return productRepository.getProducts(options);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return productRepository.getProductBySlug(slug);
  }

  async getProductById(id: string): Promise<Product | null> {
    return productRepository.getProductById(id);
  }

  async getBestSellers(limit = 6): Promise<Product[]> {
    return productRepository.getBestSellers(limit);
  }

  async getUnder10k(limit = 8): Promise<Product[]> {
    return productRepository.getUnder10k(limit);
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return productRepository.getFeaturedProducts(limit);
  }

  async getCategories(): Promise<Category[]> {
    return categoryRepository.getCategories();
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return categoryRepository.getCategoryBySlug(slug);
  }

  async getProductReviews(productId: string) {
    return productRepository.getProductReviews(productId);
  }
}

export const catalogService = new CatalogService();
