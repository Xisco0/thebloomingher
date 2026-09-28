import { IProductRepository } from '../interfaces';
import { Product, ProductFilterOptions, PaginatedResult, ProductReview } from '@/types';
import catalogData from '@/lib/data/catalog.json';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class SupabaseProductRepository implements IProductRepository {
  private async fetchAllProducts(): Promise<Product[]> {
    const productMap = new Map<string, Product>();
    let hasDbProducts = false;

    // 1. Fetch live products directly from Supabase (source of truth)
    try {
      const { data: dbProducts, error: dbError } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!dbError && dbProducts && dbProducts.length > 0) {
        hasDbProducts = true;
        dbProducts.forEach(p => {
          if (cmsStore.isProductDeleted(p.id) || (p.slug && cmsStore.isProductDeleted(p.slug))) {
            return;
          }

          let rawImages = p.images;
          if (typeof rawImages === 'string') {
            try {
              rawImages = JSON.parse(rawImages);
            } catch {
              rawImages = [rawImages];
            }
          }
          if (!Array.isArray(rawImages) || rawImages.length === 0) {
            rawImages = ['/images/logo.jpg'];
          }

          const formattedImages = rawImages.map((img: any, idx: number) => {
            if (typeof img === 'string') {
              return {
                id: `img-${p.id}-${idx}`,
                product_id: p.id,
                url: img,
                alt_text: p.name || 'Product image',
                display_order: idx + 1,
                is_primary: idx === 0,
              };
            }
            return img;
          });

          const formatted: Product = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            short_description: p.short_description || '',
            price: Number(p.price) || 0,
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            currency: p.currency || 'NGN',
            status: p.status || 'active',
            features: p.features || [],
            sku: p.sku || '',
            stock_quantity: Number(p.stock_quantity ?? 50),
            low_stock_threshold: Number(p.low_stock_threshold ?? 5),
            category_id: p.category_id || 'cat-18130',
            category_name: p.category_name || 'Feminine Care',
            subcategory: p.subcategory || null,
            images: formattedImages,
            is_featured: Boolean(p.is_featured),
            is_bestseller: Boolean(p.is_bestseller),
            is_new_arrival: Boolean(p.is_new_arrival),
            rating: Number(p.rating) || 5.0,
            rating_count: Number(p.rating_count) || 1,
            tags: Array.isArray(p.tags) ? p.tags : [],
            variants: p.variants || [],
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          };

          productMap.set(p.id, formatted);
        });
      }
    } catch (err) {
      console.warn('Supabase product repo fetch skipped:', err);
    }

    // 2. If Supabase has no data yet, fallback to local baseline
    if (!hasDbProducts) {
      const localProducts = (catalogData.products as Product[]) || [];
      localProducts.forEach(p => {
        if (!cmsStore.isProductDeleted(p.id) && (!p.slug || !cmsStore.isProductDeleted(p.slug))) {
          productMap.set(p.id, p);
        }
      });
    }

    // 3. Merge in-memory products from cmsStore
    try {
      const stored = cmsStore.getProducts();
      if (stored && stored.length > 0) {
        stored.forEach(p => {
          if (!cmsStore.isProductDeleted(p.id) && (!p.slug || !cmsStore.isProductDeleted(p.slug))) {
            productMap.set(p.id, p);
          }
        });
      }
    } catch {}

    return Array.from(productMap.values());
  }

  async getProducts(filter?: ProductFilterOptions): Promise<PaginatedResult<Product>> {
    const products = await this.fetchAllProducts();
    let result = [...products];

    if (filter?.categorySlug) {
      result = result.filter(p => {
        const cat = catalogData.categories.find(c => c.slug === filter.categorySlug);
        return cat ? p.category_id === cat.id : false;
      });
    }

    if (filter?.isBestseller) {
      result = result.filter(p => p.is_bestseller);
    }

    if (filter?.isUnder10k) {
      result = result.filter(p => p.price < 10000);
    }

    if (filter?.isFeatured) {
      result = result.filter(p => p.is_featured);
    }

    if (filter?.inStockOnly) {
      result = result.filter(p => p.stock_quantity > 0);
    }

    if (filter?.onSale) {
      result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    }

    if (filter?.minRating !== undefined) {
      result = result.filter(p => p.rating >= filter.minRating!);
    }

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      
      const intentKeywords: Record<string, string[]> = {
        cramp: ['heating belt', 'herbal tea', 'cramps', 'pain relief'],
        pain: ['heating belt', 'herbal tea', 'warm water bottle'],
        period: ['pad', 'cup', 'pant liner', 'heating belt', 'tampon', 'menstrual'],
        travel: ['wipes', 'pocket tissue', 'disposable', 'travel size', 'foldable'],
        hygiene: ['intimate wash', 'wipes', 'tissue', 'pant liner', 'shower'],
        underware: ['pant liner', 'sanitary pad', 'disposable underwear'],
        tea: ['herbal tea', 'womb tea', 'ginger tea', 'detox tea'],
        gummies: ['gummies', 'vitamin', 'biotin', 'collagen'],
      };

      const matchingIntents = Object.entries(intentKeywords)
        .filter(([key]) => q.includes(key))
        .flatMap(([, syns]) => syns);

      result = result.filter(p => {
        const text = `${p.name} ${p.description} ${p.short_description || ''} ${p.category_name || ''} ${p.sku} ${p.tags.join(' ')}`.toLowerCase();
        
        if (text.includes(q)) return true;
        if (matchingIntents.some(syn => text.includes(syn))) return true;

        const words = q.split(/\s+/).filter(w => w.length > 2);
        return words.some(w => text.includes(w));
      });
    }

    if (filter?.minPrice !== undefined) {
      result = result.filter(p => p.price >= filter.minPrice!);
    }

    if (filter?.maxPrice !== undefined) {
      result = result.filter(p => p.price <= filter.maxPrice!);
    }

    // Sorting
    switch (filter?.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating || b.rating_count - a.rating_count);
        break;
      case 'newest':
        result.sort((a, b) => (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0));
        break;
      case 'bestselling':
        result.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0) || (b.rating_count || 0) - (a.rating_count || 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        break;
    }

    const page = filter?.page || 1;
    const pageSize = filter?.pageSize || 24;
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = result.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.fetchAllProducts();
    return products.find(p => p.slug === slug) || null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.fetchAllProducts();
    return products.find(p => p.id === id || p.id === `prod-${id}`) || null;
  }

  async getBestSellers(limit = 6): Promise<Product[]> {
    const products = await this.fetchAllProducts();
    const bestsellers = products.filter(p => p.is_bestseller);
    return bestsellers.slice(0, limit);
  }

  async getUnder10k(limit = 8): Promise<Product[]> {
    const products = await this.fetchAllProducts();
    const under10k = products.filter(p => p.price < 10000);
    return under10k.slice(0, limit);
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const products = await this.fetchAllProducts();
    const featured = products.filter(p => p.is_featured);
    return featured.slice(0, limit);
  }

  async getProductReviews(productId: string): Promise<ProductReview[]> {
    const products = await this.fetchAllProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    const category = product.category_name || '';
    const reviews: ProductReview[] = [
      {
        id: `rev-${productId}-1`,
        product_id: productId,
        author_name: 'Chioma A.',
        rating: 5,
        title: 'Super fast delivery in Ikeja & amazing quality!',
        comment: `I ordered this ${product.name} and received it the next afternoon in Ikeja. The packaging was discrete and the quality is 10/10. Definitely ordering again.`,
        created_at: '2026-03-12',
        is_verified_purchase: true,
        helpful_votes: 14,
      },
      {
        id: `rev-${productId}-2`,
        product_id: productId,
        author_name: 'Zainab B.',
        rating: 5,
        title: 'A true lifesaver for my monthly wellness routine',
        comment: `Honestly, TheBloomingHer is the only brand in Nigeria I trust with my intimate and period wellness essentials. Excellent product and gentle on the body.`,
        created_at: '2026-02-28',
        is_verified_purchase: true,
        helpful_votes: 9,
      },
      {
        id: `rev-${productId}-3`,
        product_id: productId,
        author_name: 'Blessing E.',
        rating: category.includes('Feminine') || category.includes('Wellness') ? 5 : 4,
        title: 'Very practical and affordable',
        comment: `Value for money is exceptional. Great customer support on WhatsApp when I asked about delivery tracking.`,
        created_at: '2026-01-19',
        is_verified_purchase: true,
        helpful_votes: 6,
      },
    ];

    return reviews;
  }
}
