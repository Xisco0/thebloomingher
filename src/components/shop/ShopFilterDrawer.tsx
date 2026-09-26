'use client';

import React from 'react';
import { Category } from '@/types';
import { X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { FilterState } from './ShopFilterSidebar';

interface ShopFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

export function ShopFilterDrawer({
  isOpen,
  onClose,
  categories,
  filters,
  onFilterChange,
  onReset,
  totalResults,
}: ShopFilterDrawerProps) {
  if (!isOpen) return null;

  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₦5,000', value: 'under-5000' },
    { label: '₦5,000 – ₦15,000', value: '5000-15000' },
    { label: '₦15,000 – ₦30,000', value: '15000-30000' },
    { label: '₦30,000 & Above', value: 'above-30000' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand" />
            <h3 className="font-display font-bold text-lg text-text-main">
              Filters
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-muted transition-colors"
            aria-label="Close filter drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Category
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => onFilterChange({ categorySlug: 'all' })}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium ${
                  filters.categorySlug === 'all'
                    ? 'bg-brand text-white font-bold'
                    : 'bg-surface-muted text-text-body'
                }`}
              >
                <span>All Categories</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ categorySlug: cat.slug })}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-left ${
                    filters.categorySlug === cat.slug
                      ? 'bg-brand text-white font-bold'
                      : 'bg-surface-muted text-text-body'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Price Range
            </h4>
            <div className="space-y-2">
              {priceRanges.map(range => (
                <label
                  key={range.value}
                  className="flex items-center gap-3 text-xs text-text-body cursor-pointer p-2 rounded-lg hover:bg-surface-muted"
                >
                  <input
                    type="radio"
                    name="priceRangeMobile"
                    checked={filters.priceRange === range.value}
                    onChange={() => onFilterChange({ priceRange: range.value })}
                    className="w-4 h-4 text-brand accent-brand"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Deals & Toggles */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Deals & Availability
            </h4>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 text-xs text-text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={e => onFilterChange({ inStockOnly: e.target.checked })}
                  className="w-4 h-4 rounded text-brand accent-brand"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center gap-3 text-xs text-text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.under10k}
                  onChange={e => onFilterChange({ under10k: e.target.checked })}
                  className="w-4 h-4 rounded text-brand accent-brand"
                />
                <span>Under ₦10,000 Finds</span>
              </label>

              <label className="flex items-center gap-3 text-xs text-text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onSale}
                  onChange={e => onFilterChange({ onSale: e.target.checked })}
                  className="w-4 h-4 rounded text-brand accent-brand"
                />
                <span>On Sale / Discounted</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-3 border border-border rounded-full text-xs font-semibold text-text-muted hover:text-text-main flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs text-center shadow-sm"
          >
            Show {totalResults} Products
          </button>
        </div>
      </div>
    </div>
  );
}
