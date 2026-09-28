'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  TrendingUp,
  Save,
  Package,
} from 'lucide-react';
import { Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(productId);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, stock_quantity: newStock } : p))
        );
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const totalUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const totalStockValue = products.reduce((sum, p) => sum + p.stock_quantity * p.price, 0);
  const lowStockCount = products.filter(
    p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10)
  ).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  // Filter
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const isLow = p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10);
    const isOut = p.stock_quantity === 0;
    const isIn = p.stock_quantity > (p.low_stock_threshold || 10);

    let matchesStatus = true;
    if (statusFilter === 'in_stock') matchesStatus = isIn;
    if (statusFilter === 'low_stock') matchesStatus = isLow;
    if (statusFilter === 'out_of_stock') matchesStatus = isOut;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Stock
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Check and update available product quantities in your store.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Units</span>
            <Boxes className="w-4 h-4 text-brand" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">{totalUnits} units</p>
          <p className="text-[10px] text-text-muted mt-1">Across {products.length} catalog items</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Valuation</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-emerald-700">
            {formatNaira(totalStockValue)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">At active selling retail price</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock (≤ 10)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-amber-600">{lowStockCount} items</p>
          <p className="text-[10px] text-text-muted mt-1">Re-ordering recommended</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-rose-600">{outOfStockCount} items</p>
          <p className="text-[10px] text-text-muted mt-1">Unavailable on storefront</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 'low_stock', 'out_of_stock', 'in_stock'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface-muted/60 text-text-body hover:bg-surface-muted'
              }`}
            >
              {f === 'all' && 'All Products'}
              {f === 'low_stock' && `Low Stock (${lowStockCount})`}
              {f === 'out_of_stock' && `Out of Stock (${outOfStockCount})`}
              {f === 'in_stock' && 'Adequate Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Content */}
      {filteredProducts.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-8 sm:p-16 text-center">
          <p className="text-sm font-semibold text-text-main">No items match the current inventory filter.</p>
          <p className="text-xs text-text-muted mt-1">Try adjusting your search query or filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Mobile Inventory Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map(product => {
              const isLow =
                product.stock_quantity > 0 &&
                product.stock_quantity <= (product.low_stock_threshold || 10);
              const isOut = product.stock_quantity === 0;

              return (
                <div
                  key={product.id}
                  className="bg-surface rounded-2xl p-4 border border-border/80 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-muted border border-border flex-shrink-0">
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

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-text-main leading-tight line-clamp-2">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-medium text-text-muted">{product.sku}</span>
                        <span className="text-[10px] text-text-muted">•</span>
                        <span className="text-xs font-bold text-text-main">{formatNaira(product.price)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <div>
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock ({product.stock_quantity})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          {product.stock_quantity} units
                        </span>
                      )}
                    </div>

                    {/* Touch-Friendly Stock Adjuster */}
                    <div className="flex items-center gap-1.5 bg-surface-muted/60 p-1 rounded-xl border border-border/60">
                      <button
                        onClick={() => handleAdjustStock(product.id, Math.max(0, product.stock_quantity - 1))}
                        disabled={updatingId === product.id || product.stock_quantity <= 0}
                        className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-xs text-text-main active:scale-95 disabled:opacity-40 transition-all shadow-xs"
                        aria-label="Decrease stock"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs px-2 text-text-main min-w-[28px] text-center">
                        {product.stock_quantity}
                      </span>
                      <button
                        onClick={() => handleAdjustStock(product.id, product.stock_quantity + 1)}
                        disabled={updatingId === product.id}
                        className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-xs text-text-main active:scale-95 disabled:opacity-40 transition-all shadow-xs"
                        aria-label="Increase stock"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleAdjustStock(product.id, product.stock_quantity + 10)}
                        disabled={updatingId === product.id}
                        className="px-2 h-8 rounded-lg bg-brand-light text-brand border border-brand/20 flex items-center justify-center font-bold text-[10px] active:scale-95 disabled:opacity-40 transition-all shadow-xs"
                        title="Restock +10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Inventory Table (>= md) */}
          <div className="hidden md:block bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Retail Price (₦)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Stock Level</th>
                    <th className="py-3.5 px-4 text-right">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProducts.map(product => {
                    const isLow =
                      product.stock_quantity > 0 &&
                      product.stock_quantity <= (product.low_stock_threshold || 10);
                    const isOut = product.stock_quantity === 0;

                    return (
                      <tr key={product.id} className="hover:bg-surface-muted/40 transition-colors">
                        {/* Product */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-muted border border-border flex-shrink-0">
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
                              <p className="font-bold text-text-main truncate">{product.name}</p>
                              <p className="text-[10px] text-text-muted">{product.category_name}</p>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono text-text-body font-semibold">
                          {product.sku}
                        </td>

                        {/* Retail Price */}
                        <td className="py-3.5 px-4 font-display font-bold text-text-main">
                          {formatNaira(product.price)}
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Current Stock Units */}
                        <td className="py-3.5 px-4 font-mono font-bold text-sm text-text-main">
                          {product.stock_quantity} <span className="text-xs text-text-muted font-normal">units</span>
                        </td>

                        {/* Quick Adjust Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(product.id, Math.max(0, product.stock_quantity - 5))}
                              disabled={updatingId === product.id || product.stock_quantity < 5}
                              className="px-2 py-1 bg-surface hover:bg-surface-muted text-text-muted border border-border rounded-lg text-[10px] font-bold disabled:opacity-30 transition-colors"
                              title="Subtract 5 units"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleAdjustStock(product.id, Math.max(0, product.stock_quantity - 1))}
                              disabled={updatingId === product.id || product.stock_quantity <= 0}
                              className="w-7 h-7 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-lg text-xs font-bold disabled:opacity-30 transition-colors flex items-center justify-center"
                              title="Subtract 1 unit"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleAdjustStock(product.id, product.stock_quantity + 1)}
                              disabled={updatingId === product.id}
                              className="w-7 h-7 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                              title="Add 1 unit"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleAdjustStock(product.id, product.stock_quantity + 10)}
                              disabled={updatingId === product.id}
                              className="px-2 py-1 bg-brand-light hover:bg-brand/20 text-brand border border-brand/20 rounded-lg text-[10px] font-bold transition-colors"
                              title="Restock +10 units"
                            >
                              +10
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
        </>
      )}
    </div>
  );
}
