'use client';

import React from 'react';
import { Category } from '@/types';
import { RotateCcw, Check, Sparkles } from 'lucide-react';
import { formatNaira } from '@/lib/utils/currency';

export interface FilterState {
  categorySlug: string;
  priceRange: string;
  inStockOnly: boolean;
  onSale: boolean;
  under10k: boolean;
  minRating: number;
  sortBy: string;
}

interface ShopFilterSidebarProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  totalProductsCount: number;
}

export function ShopFilterSidebar({
  categories,
  filters,
  onFilterChange,
  onReset,
  totalProductsCount,
}: ShopFilterSidebarProps) {
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₦5,000', value: 'under-5000' },
    { label: '₦5,000 – ₦15,000', value: '5000-15000' },
    { label: '₦15,000 – ₦30,000', value: '15000-30000' },
    { label: '₦30,000 & Above', value: 'above-30000' },
  ];

  const hasActiveFilters =
    filters.categorySlug !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.inStockOnly ||
    filters.onSale ||
    filters.under10k ||
    filters.minRating > 0;

  return (
    <div className="bg-surface rounded-3xl p-6 border border-border/80 shadow-subtle space-y-6 sticky top-24">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <h3 className="font-display font-bold text-base text-text-main">
          Filter Products
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-brand hover:underline font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Categories
        </h4>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onFilterChange({ categorySlug: 'all' })}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              filters.categorySlug === 'all'
                ? 'bg-brand-light text-brand font-bold'
                : 'text-text-body hover:bg-surface-muted'
            }`}
          >
            <span>All Categories</span>
            <span className="text-[11px] opacity-70">({totalProductsCount})</span>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onFilterChange({ categorySlug: cat.slug })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                filters.categorySlug === cat.slug
                  ? 'bg-brand-light text-brand font-bold'
                  : 'text-text-body hover:bg-surface-muted'
              }`}
            >
              <span className="truncate pr-2">{cat.name}</span>
              {cat.total_products !== undefined && (
                <span className="text-[11px] opacity-70">({cat.total_products})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Ranges */}
      <div className="space-y-3 pt-4 border-t border-border/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Price Range
        </h4>
        <div className="space-y-1.5">
          {priceRanges.map(range => (
            <label
              key={range.value}
              className="flex items-center gap-2.5 text-xs text-text-body cursor-pointer hover:text-brand"
            >
              <input
                type="radio"
                name="priceRangeDesktop"
                checked={filters.priceRange === range.value}
                onChange={() => onFilterChange({ priceRange: range.value })}
                className="w-4 h-4 text-brand border-border focus:ring-brand accent-brand"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability & Deals */}
      <div className="space-y-3 pt-4 border-t border-border/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Preferences & Deals
        </h4>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-xs text-text-body cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={e => onFilterChange({ inStockOnly: e.target.checked })}
              className="w-4 h-4 rounded text-brand border-border focus:ring-brand accent-brand"
            />
            <span>In Stock Only</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-text-body cursor-pointer">
            <input
              type="checkbox"
              checked={filters.under10k}
              onChange={e => onFilterChange({ under10k: e.target.checked })}
              className="w-4 h-4 rounded text-brand border-border focus:ring-brand accent-brand"
            />
            <span>Under ₦10,000 Budget Finds</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-text-body cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onSale}
              onChange={e => onFilterChange({ onSale: e.target.checked })}
              className="w-4 h-4 rounded text-brand border-border focus:ring-brand accent-brand"
            />
            <span>On Sale / Discounted</span>
          </label>
        </div>
      </div>
    </div>
  );
}
