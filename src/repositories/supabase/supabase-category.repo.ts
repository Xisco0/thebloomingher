import { ICategoryRepository } from '../interfaces';
import { Category } from '@/types';
import catalogData from '@/lib/data/catalog.json';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabaseCategoryRepository implements ICategoryRepository {
  private async fetchAllCategories(): Promise<Category[]> {
    const catMap = new Map<string, Category>();
    let hasDbCategories = false;

    // 1. Fetch live categories from Supabase (authoritative source of truth)
    try {
      const { data: dbCategories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(dbCategories)) {
        hasDbCategories = true;
        for (const c of dbCategories) {
          const formatted: Category = {
            id: c.id,
            legacy_id: c.legacy_id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            image_url: c.image_url || '/images/logo.jpg',
            parent_id: c.parent_id,
            display_order: Number(c.display_order ?? 0),
            is_active: c.is_active !== false,
            seo_title: c.seo_title,
            seo_description: c.seo_description,
          };
          catMap.set(c.id, formatted);
        }
      }
    } catch (err) {
      console.warn('Supabase categories fetch skipped:', err);
    }

    // 2. Fallback to base catalog only if database query failed
    if (!hasDbCategories) {
      const local = (catalogData.categories as Category[]) || [];
      local.forEach(c => {
        catMap.set(c.id, c);
      });
    }

    return Array.from(catMap.values()).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );
  }

  async getCategories(): Promise<Category[]> {
    return this.fetchAllCategories();
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const all = await this.fetchAllCategories();
    return all.find(c => c.slug === slug) || null;
  }
}

