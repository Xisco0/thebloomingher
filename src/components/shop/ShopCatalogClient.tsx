'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { ShopFilterSidebar, FilterState } from './ShopFilterSidebar';
import { ShopFilterDrawer } from './ShopFilterDrawer';
import { SlidersHorizontal, ArrowUpDown, Search, RotateCcw, PackageOpen } from 'lucide-react';
import { analytics } from '@/lib/analytics/events';

interface ShopCatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  initialCategorySlug?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export function ShopCatalogClient({
  initialProducts,
  categories,
  initialCategorySlug = 'all',
  pageTitle = 'Shop All Products',
  pageDescription = 'Explore our curated range of premium feminine care, period relief, and everyday wellness essentials.',
}: ShopCatalogClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(16);

  const [filters, setFilters] = useState<FilterState>({
    categorySlug: initialCategorySlug,
    priceRange: 'all',
    inStockOnly: false,
    onSale: false,
    under10k: false,
    minRating: 0,
    sortBy: 'featured',
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      analytics.track('filter_applied', { filters: updated });
      return updated;
    });
    setVisibleCount(16); // Reset pagination on filter change
  };

  const handleReset = () => {
    setFilters({
      categorySlug: 'all',
      priceRange: 'all',
      inStockOnly: false,
      onSale: false,
      under10k: false,
      minRating: 0,
      sortBy: 'featured',
    });
    setSearchQuery('');
    setVisibleCount(16);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category Filter
    if (filters.categorySlug !== 'all') {
      const cat = categories.find(c => c.slug === filters.categorySlug);
      if (cat) {
        result = result.filter(p => p.category_id === cat.id);
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)) ||
          (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    // Price Range Filter
    if (filters.priceRange === 'under-5000') {
      result = result.filter(p => p.price < 5000);
    } else if (filters.priceRange === '5000-15000') {
      result = result.filter(p => p.price >= 5000 && p.price <= 15000);
    } else if (filters.priceRange === '15000-30000') {
      result = result.filter(p => p.price > 15000 && p.price <= 30000);
    } else if (filters.priceRange === 'above-30000') {
      result = result.filter(p => p.price > 30000);
    }

    // In Stock Only
    if (filters.inStockOnly) {
      result = result.filter(p => p.stock_quantity > 0);
    }

    // On Sale
    if (filters.onSale) {
      result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    }

    // Under ₦10k
    if (filters.under10k) {
      result = result.filter(p => p.price < 10000);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating || (b.rating_count || 0) - (a.rating_count || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0));
        break;
      case 'bestselling':
        result.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
        break;
    }

    return result;
  }, [initialProducts, categories, filters, searchQuery]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const activeFiltersCount =
    (filters.categorySlug !== 'all' ? 1 : 0) +
    (filters.priceRange !== 'all' ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.under10k ? 1 : 0);

  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      {/* Header & Category Navigation Bar */}
      <div className="mb-8 space-y-4">
        {pageTitle && (
          <div className="max-w-3xl">
            <h1 className="font-display font-bold text-2xl sm:text-4xl text-text-main">
              {pageTitle}
            </h1>
            {pageDescription && (
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                {pageDescription}
              </p>
            )}
          </div>
        )}

        {/* Category Horizontal Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-2">
          <button
            onClick={() => handleFilterChange({ categorySlug: 'all' })}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              filters.categorySlug === 'all'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-surface hover:bg-surface-muted text-text-body border border-border'
            }`}
          >
            All Products ({initialProducts.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleFilterChange({ categorySlug: cat.slug })}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                filters.categorySlug === cat.slug
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-surface hover:bg-surface-muted text-text-body border border-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Search, Filters Trigger, Count, and Sort */}
      <div className="bg-surface rounded-2xl p-3.5 sm:p-4 border border-border/80 shadow-subtle mb-8 flex flex-col md:flex-row items-center justify-between gap-3.5 sm:gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80 min-w-0">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (e.target.value.length > 2) {
                analytics.track('search_performed', { searchTerm: e.target.value });
              }
            }}
            placeholder="Search products, keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-surface-muted border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          />
        </div>

        {/* Count & Actions */}
        <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-2.5 sm:gap-3">
          {/* Mobile Filter Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border border-border bg-surface text-xs font-semibold text-text-main hover:bg-surface-muted transition-colors relative"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Product Count */}
          <span className="text-xs text-text-muted font-medium">
            Showing <strong className="text-text-main">{displayedProducts.length}</strong> of{' '}
            <strong className="text-text-main">{filteredProducts.length}</strong> products
          </span>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
            <select
              value={filters.sortBy}
              onChange={e => handleFilterChange({ sortBy: e.target.value })}
              className="px-3 py-2 rounded-full border border-border bg-surface text-xs font-medium text-text-main focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="bestselling">Best Selling</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar 25% + Grid 75% */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-1">
          <ShopFilterSidebar
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            totalProductsCount={initialProducts.length}
          />
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-8">
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-6">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-surface rounded-3xl p-12 border border-border text-center space-y-4 max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mx-auto text-brand">
                <PackageOpen className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-main">
                No matching products found
              </h3>
              <p className="text-xs text-text-muted">
                Try adjusting your search terms, changing the price range, or clearing active filters.
              </p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Load More Pagination */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount(prev => prev + 16)}
                className="px-8 py-3.5 bg-surface hover:bg-brand-light text-brand hover:text-brand border border-brand/30 rounded-full font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                Load More Products ({filteredProducts.length - displayedProducts.length} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-over Filter Drawer */}
      <ShopFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        totalResults={filteredProducts.length}
      />
    </div>
  );
}
