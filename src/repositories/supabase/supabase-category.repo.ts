import { ICategoryRepository } from '../interfaces';
import { Category } from '@/types';
import catalogData from '@/lib/data/catalog.json';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabaseCategoryRepository implements ICategoryRepository {
  private async fetchAllCategories(): Promise<Category[]> {
    const catMap = new Map<string, Category>();

    // 1. Base catalog categories
    const local = (catalogData.categories as Category[]) || [];
    local.forEach(c => {
      catMap.set(c.id, c);
      if (c.slug) catMap.set(c.slug, c);
    });

    // 2. Fetch live categories from Supabase
    try {
      const { data: dbCategories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && dbCategories && dbCategories.length > 0) {
        for (const c of dbCategories) {
          const matchingLocal = local.find(loc => loc.id === c.id || loc.slug === c.slug);
          let finalImageUrl = c.image_url;

          // If db has old generic placeholder or missing, upgrade to distinct curated image
          if (!finalImageUrl || finalImageUrl.includes('sbeli1b41qdlryawrrzn.jpg')) {
            finalImageUrl = matchingLocal?.image_url || finalImageUrl;

            // Silently update Supabase in background
            if (matchingLocal?.image_url) {
              void supabaseAdmin
                .from('categories')
                .update({ image_url: matchingLocal.image_url })
                .eq('id', c.id);
            }
          }

          const formatted: Category = {
            id: c.id,
            legacy_id: c.legacy_id,
            name: c.name,
            slug: c.slug,
            description: c.description || matchingLocal?.description,
            image_url: finalImageUrl || matchingLocal?.image_url,
            parent_id: c.parent_id,
            display_order: c.display_order ?? matchingLocal?.display_order ?? 0,
            is_active: c.is_active !== false,
            seo_title: c.seo_title || matchingLocal?.seo_title,
            seo_description: c.seo_description || matchingLocal?.seo_description,
          };
          catMap.set(c.id, formatted);
          if (c.slug) catMap.set(c.slug, formatted);
        }
      }
    } catch (err) {
      console.warn('Supabase categories fetch skipped:', err);
    }

    return Array.from(new Set(Array.from(catMap.values()).map(c => c.id)))
      .map(id => Array.from(catMap.values()).find(c => c.id === id)!)
      .filter(Boolean)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  async getCategories(): Promise<Category[]> {
    return this.fetchAllCategories();
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const all = await this.fetchAllCategories();
    return all.find(c => c.slug === slug) || null;
  }
}
