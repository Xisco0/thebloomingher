'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { catalogService } from '@/services';
import { Product, Category } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-search-modal', handleOpen);

    async function loadData() {
      const res = await catalogService.getProducts({ pageSize: 100 });
      const cats = await catalogService.getCategories();
      setProducts(res.data);
      setCategories(cats);
    }
    loadData();

    return () => window.removeEventListener('open-search-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredProducts([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
    setFilteredProducts(matches.slice(0, 6));
  }, [query, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/60 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-20 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-elevated border border-border overflow-hidden">
        {/* Search Bar Input */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center gap-3">
          <Search className="w-5 h-5 text-brand flex-shrink-0" />
          <input
            type="text"
            placeholder="Search menstrual kits, tea, heating belt, wipes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-text-main placeholder-text-muted text-base sm:text-lg font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-main p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 bg-surface-muted text-text-muted hover:text-text-main text-xs font-semibold rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
          {query.trim() === '' ? (
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-wider text-text-muted font-bold block">
                Popular Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-light text-brand rounded-full text-xs font-medium hover:bg-brand hover:text-white transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-2">
                <span className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-2">
                  Trending Searches
                </span>
                <div className="flex flex-wrap gap-2 text-xs text-text-body">
                  {['Menstrual Heating Belt', 'Herbal Tea', 'Bloomie Care Package', 'Shoe Wipes', 'Vitamin C'].map(
                    term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1 rounded-md bg-surface-muted hover:bg-border transition-colors"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-text-muted font-bold block">
                Found {filteredProducts.length} Results
              </span>
              <div className="space-y-2">
                {filteredProducts.map(prod => (
                  <Link
                    key={prod.id}
                    href={`/products/${prod.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-light/40 border border-transparent hover:border-brand/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
                        <Image
                          src={prod.images[0]?.url || ''}
                          alt={prod.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-text-main group-hover:text-brand transition-colors">
                          {prod.name}
                        </h4>
                        <span className="text-xs text-text-muted">{prod.category_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-brand">{formatNaira(prod.price)}</span>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted space-y-2">
              <p className="text-sm">No products found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs">Try searching for feminine care, period kit, wipes, or tea.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
