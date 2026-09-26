'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';
import catalogData from '@/lib/data/catalog.json';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out_of_stock'>('all');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the store catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleStockUpdate = async (productId: string, delta: number) => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, delta }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, stock_quantity: data.product.stock_quantity } : p))
        );
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.tags && product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 10);
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = product.stock_quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Product Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage your store items, pricing, inventory thresholds, and online visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors"
            title="Refresh product list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, SKU, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-brand font-medium"
          >
            <option value="all">All Categories ({products.length})</option>
            {catalogData.categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as any)}
            className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-brand font-medium"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock (≤ 10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price (₦)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Badges</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No products found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLow = product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 10);
                  const isOut = product.stock_quantity === 0;

                  return (
                    <tr key={product.id} className="hover:bg-surface-muted/40 transition-colors group">
                      {/* Product Image & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-muted border border-border flex-shrink-0">
                            <Image
                              src={
                                (typeof product.images[0] === 'string'
                                  ? product.images[0]
                                  : product.images[0]?.url) ||
                                '/images/logo.jpg'
                              }
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="font-bold text-text-main hover:text-brand transition-colors block truncate"
                            >
                              {product.name}
                            </Link>
                            <span className="text-[10px] text-text-muted font-mono block mt-0.5">
                              SKU: {product.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-text-body font-medium">
                        {product.category_name}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-display font-bold text-text-main">
                        <div>{formatNaira(product.price)}</div>
                        {product.compare_at_price && (
                          <div className="text-[10px] text-text-muted line-through font-normal">
                            {formatNaira(product.compare_at_price)}
                          </div>
                        )}
                      </td>

                      {/* Stock with quick adjust buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {product.stock_quantity} in stock
                          </span>

                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStockUpdate(product.id, -1)}
                              disabled={product.stock_quantity <= 0}
                              className="w-5 h-5 rounded bg-surface border border-border hover:bg-surface-muted flex items-center justify-center text-text-body font-bold text-xs disabled:opacity-30"
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleStockUpdate(product.id, 1)}
                              className="w-5 h-5 rounded bg-surface border border-border hover:bg-surface-muted flex items-center justify-center text-text-body font-bold text-xs"
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {product.is_bestseller && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                              Best Seller
                            </span>
                          )}
                          {product.is_featured && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-light text-brand">
                              Featured
                            </span>
                          )}
                          {product.is_new_arrival && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-text-muted hover:text-brand hover:bg-surface-muted rounded-lg transition-colors"
                            title="View on live storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 text-text-muted hover:text-brand hover:bg-surface-muted rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
