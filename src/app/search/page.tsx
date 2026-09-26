import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { catalogService } from '@/services';
import { ProductCard } from '@/components/product/ProductCard';

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const q = searchParams.q || '';
  return {
    title: q ? `Search results for "${q}" | TheBloomingHer Nigeria` : 'Search Products | TheBloomingHer Nigeria',
    description: `Browse product search results for ${q} on TheBloomingHer Care & Wellness Nigeria.`,
    alternates: {
      canonical: 'https://thebloomingher.com/search',
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const [productsRes, categories, bestSellers] = await Promise.all([
    catalogService.getProducts({
      searchQuery: query,
      categorySlug: searchParams.category,
      sortBy: searchParams.sort,
      pageSize: 40,
    }),
    catalogService.getCategories(),
    catalogService.getBestSellers(4),
  ]);

  return (
    <div className="w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center mb-8 space-y-3">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          Search Catalog
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
          {query ? (
            <>
              Results for &ldquo;<span className="text-brand">{query}</span>&rdquo;
            </>
          ) : (
            'Search All Wellness & Care Products'
          )}
        </h1>
        <p className="text-sm text-text-muted">
          Found <strong>{productsRes.total}</strong> products matching your criteria.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            !searchParams.category
              ? 'bg-brand text-white'
              : 'bg-surface border border-border text-text-main hover:bg-brand-light'
          }`}
        >
          All ({productsRes.total})
        </Link>
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/search?q=${encodeURIComponent(query)}&category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              searchParams.category === cat.slug
                ? 'bg-brand text-white border-brand'
                : 'bg-surface border-border text-text-main hover:bg-brand-light'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Results Grid */}
      {productsRes.data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {productsRes.data.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        /* Friendly Empty State with Alternatives */
        <div className="bg-surface rounded-3xl p-8 sm:p-14 border border-border text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-xl text-text-main">
              No products found for &ldquo;{query}&rdquo;
            </h3>
            <p className="text-sm text-text-muted mt-2">
              Try searching with a broader term, or explore our best-selling customer favorites below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2 text-xs">
            {['Menstrual Heating Belt', 'Herbal Tea', 'Sanitary Pads', 'Bloomie Care', 'Wipes'].map(term => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="px-3.5 py-1.5 rounded-full bg-surface-muted hover:bg-brand-light hover:text-brand border border-border transition-colors font-medium"
              >
                {term}
              </Link>
            ))}
          </div>

          <div className="pt-8 border-t border-border">
            <h4 className="font-display font-semibold text-sm text-text-main mb-4 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Recommended Customer Favorites</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {bestSellers.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
