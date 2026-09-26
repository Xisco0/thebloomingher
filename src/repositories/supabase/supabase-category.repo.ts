import { ICategoryRepository } from '../interfaces';
import { Category } from '@/types';
import catalogData from '@/lib/data/catalog.json';

export class SupabaseCategoryRepository implements ICategoryRepository {
  private categories: Category[] = catalogData.categories as Category[];

  async getCategories(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.display_order - b.display_order);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const category = this.categories.find(c => c.slug === slug);
    return category || null;
  }
}
