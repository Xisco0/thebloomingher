'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  PackageCheck,
  PackageX,
} from 'lucide-react';
import { Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';
import { ProductSubNav } from '@/components/admin/subnav/ProductSubNav';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

const EVERYDAY_SUBCATEGORIES = [
  'All Subcategories',
  'Drinkware',
  'Personal Accessories',
  'Electronics Accessories',
  'Bags',
  'Stationery',
  'Home & Lifestyle',
  'Gift Ideas',
  'Fitness & Hydration',
  'Travel & On - The - Go',
];

export default function AdminEverydayEssentialsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All Subcategories');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        // Filter strictly for Everyday Essentials category (cat-18133 or name matching Everyday Essentials)
        const everydayProducts = (data.products || []).filter(
          (p: Product) =>
            p.category_id === 'cat-18133' ||
            p.category_id === 'everyday-essentials' ||
            (p.category_name || '').toLowerCase() === 'everyday essentials'
        );
        setProducts(everydayProducts);
      }
    } catch (err) {
      console.error('Failed to load Everyday Essentials products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${productToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        setProductToDelete(null);
      } else {
        alert(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'draft' ? 'active' : 'draft';
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev =>
          prev.map(p => (p.id === product.id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subcategory || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.tags && product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesSubcategory =
      selectedSubcategory === 'All Subcategories' ||
      product.subcategory === selectedSubcategory;

    const matchesStatus =
      statusFilter === 'all' || product.status === statusFilter;

    return matchesSearch && matchesSubcategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <ProductSubNav />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
              Everyday Essentials
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-light text-brand border border-brand/20">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage lifestyle products, coffee mugs, water bottles, wristwatches, accessories & gifts.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors"
            title="Refresh products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/admin/products/new?category=cat-18133"
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Everyday Product</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search Everyday Essentials..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand min-h-[44px]"
          />
        </div>

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
          {/* Subcategory Filter */}
          <select
            value={selectedSubcategory}
            onChange={e => setSelectedSubcategory(e.target.value)}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-brand font-medium min-h-[44px]"
          >
            {EVERYDAY_SUBCATEGORIES.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-brand font-medium min-h-[44px]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Visible)</option>
            <option value="draft">Draft (Hidden)</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredProducts.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-8 sm:p-16 text-center">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">
              {searchQuery ? 'No matching everyday products' : 'No Everyday Essentials products found'}
            </p>
            <p className="text-xs text-text-muted">
              {searchQuery
                ? 'Try changing your search terms or filter selection.'
                : 'Add everyday lifestyle products like coffee mugs, water bottles, or watches.'}
            </p>
            <Link
              href="/admin/products/new?category=cat-18133"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Everyday Product</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Subcategory</th>
                  <th className="py-3.5 px-4">Price (₦)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.map(product => {
                  const isOut = product.stock_quantity === 0;
                  const isDraft = product.status === 'draft';

                  return (
                    <tr key={product.id} className="hover:bg-surface-muted/40 transition-colors group">
                      {/* Product Image & Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-muted border border-border flex-shrink-0">
                            <Image
                              src={
                                (typeof product.images[0] === 'string'
                                  ? product.images[0]
                                  : product.images[0]?.url) || '/images/logo.jpg'
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

                      {/* Subcategory */}
                      <td className="py-3.5 px-4 text-text-body font-medium">
                        {product.subcategory || 'General Essentials'}
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

                      {/* Stock Adjustment */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {product.stock_quantity} in stock
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                      {/* Visibility Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            isDraft
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title={isDraft ? 'Click to Publish / Enable' : 'Click to Hide / Disable'}
                        >
                          {isDraft ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isDraft ? 'Hidden (Draft)' : 'Visible (Active)'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-text-muted hover:text-brand hover:bg-surface-muted rounded-lg transition-colors"
                            title="View product live"
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
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => {
          if (!deleting) setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Everyday Essential Product?"
        itemTitle={productToDelete?.name}
        itemSubtitle={productToDelete?.sku ? `SKU: ${productToDelete.sku}` : undefined}
        message={`Are you sure you want to delete "${productToDelete?.name}"? This product will be removed from Everyday Essentials.`}
        confirmLabel="Yes, Delete Product"
      />
    </div>
  );
}
