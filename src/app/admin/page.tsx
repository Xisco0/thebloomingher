'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Tags,
  Calendar,
  Eye,
} from 'lucide-react';
import { Order, Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [currentAdmin, setCurrentAdmin] = useState<{
    full_name: string;
    email: string;
    role_name: string;
    role: string;
    permissions?: string[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, prodsRes, meRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/products'),
        fetch('/api/auth/admin/me'),
      ]);
      const ordersData = await ordersRes.json();
      const prodsData = await prodsRes.json();
      const meData = await meRes.json();

      if (ordersData.success) setOrders(ordersData.orders || []);
      if (prodsData.success) setProducts(prodsData.products || []);
      if (meData.success && meData.admin) setCurrentAdmin(meData.admin);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders by timeframe
  const now = new Date();
  const filteredOrders = orders.filter(order => {
    if (timeframe === 'all') return true;
    const orderDate = new Date(order.created_at);
    const diffHours = (now.getTime() - orderDate.getTime()) / (1000 * 3600);
    if (timeframe === 'today') return diffHours <= 24;
    if (timeframe === '7d') return diffHours <= 24 * 7;
    if (timeframe === '30d') return diffHours <= 24 * 30;
    return true;
  });

  // Calculate metrics
  const totalRevenue = filteredOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const todayOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    return (now.getTime() - d.getTime()) <= 24 * 3600 * 1000;
  });
  const todayRevenue = todayOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingFulfillmentOrders = orders.filter(
    o => o.payment_status === 'paid' && (o.order_status === 'paid' || o.order_status === 'processing')
  );

  const uniqueCustomerEmails = new Set(orders.map(o => o.customer_email.toLowerCase())).size;
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10));

  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
      case 'paid':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
      case 'cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-brand uppercase tracking-wider block mb-1">
            Store Overview
          </span>
          <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-text-main">
            Welcome back{currentAdmin?.full_name ? `, ${currentAdmin.full_name}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Here is a simple summary of what is happening in your store today.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Timeframe Filter (Scrollable on narrow mobile) */}
          <div className="flex-1 sm:flex-initial overflow-x-auto scrollbar-none bg-surface-muted p-1 rounded-xl border border-border text-xs font-semibold flex items-center gap-0.5">
            {(['today', '7d', '30d', 'all'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs ${
                  timeframe === tf
                    ? 'bg-surface text-brand shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {tf === 'today' && 'Today'}
                {tf === '7d' && 'Last 7 Days'}
                {tf === '30d' && 'Last 30 Days'}
                {tf === 'all' && 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors flex-shrink-0"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Quick Actions
          </span>
          <span className="text-[11px] text-text-muted hidden xs:inline">Common store tasks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all text-center min-h-[44px]"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Add Product</span>
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-xl text-xs font-semibold transition-colors text-center min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="truncate">View Orders</span>
          </Link>

          <Link
            href="/admin/marketing/promotions"
            className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-xl text-xs font-semibold transition-colors text-center min-h-[44px]"
          >
            <Tags className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="truncate">Add Promotion</span>
          </Link>

          <Link
            href="/admin/marketing/events"
            className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-xl text-xs font-semibold transition-colors text-center min-h-[44px]"
          >
            <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="truncate">Add Event</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Store Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {/* 1. Today's Sales */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Today&apos;s Sales</span>
            <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center text-brand flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main break-words">
            {formatNaira(todayRevenue)}
          </p>
          <p className="text-[11px] sm:text-xs text-text-muted mt-1 truncate">
            Period: <span className="font-semibold text-text-body">{formatNaira(totalRevenue)}</span>
          </p>
        </div>

        {/* 2. Total Orders */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {filteredOrders.length}
          </p>
          <Link href="/admin/orders" className="text-xs text-brand hover:underline font-semibold mt-1 inline-block">
            View all orders &rarr;
          </Link>
        </div>

        {/* 3. Pending Orders (To Ship) */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 truncate">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-amber-600">
            {pendingFulfillmentOrders.length}
          </p>
          <Link href="/admin/orders" className="text-xs text-amber-700 hover:underline font-semibold mt-1 inline-block">
            Waiting to ship &rarr;
          </Link>
        </div>

        {/* 4. Total Customers */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {uniqueCustomerEmails}
          </p>
          <Link href="/admin/customers" className="text-xs text-blue-600 hover:underline font-semibold mt-1 inline-block">
            Customer list &rarr;
          </Link>
        </div>

        {/* 5. Products */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Products</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {products.length}
          </p>
          <Link href="/admin/products" className="text-xs text-emerald-700 hover:underline font-semibold mt-1 inline-block">
            Catalogue &rarr;
          </Link>
        </div>

        {/* 6. Low Stock Alert */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-rose-400/50 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 truncate">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-rose-600">
            {lowStockProducts.length}
          </p>
          <Link href="/admin/inventory" className="text-xs text-rose-700 hover:underline font-semibold mt-1 inline-block">
            Low items &rarr;
          </Link>
        </div>
      </div>

      {/* Main Split: Recent Orders (Left) & Low Stock (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Orders Section (2 Columns) */}
        <div className="lg:col-span-2 bg-surface rounded-2xl sm:rounded-3xl border border-border/80 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-text-main">Recent Orders</h2>
              <p className="text-xs text-text-muted">Latest purchases made on your store</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-brand hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 px-4 bg-surface-muted/40 rounded-2xl border border-border/60 space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-text-main">No orders yet</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                When customers purchase items from your store, their orders will show up here.
              </p>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-text-main hover:bg-surface-muted transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visit Storefront</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-semibold">Order</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Payment</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                      <th className="pb-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {orders.slice(0, 6).map(order => {
                      const orderDate = new Date(order.created_at).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                      });
                      return (
                        <tr key={order.id} className="hover:bg-surface-muted/40 transition-colors">
                          <td className="py-3.5">
                            <p className="font-mono font-bold text-brand">
                              {order.order_number}
                            </p>
                            <p className="text-[10px] text-text-muted">{orderDate}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="font-semibold text-text-main">{order.customer_name}</p>
                            <p className="text-[10px] text-text-muted">{order.customer_email}</p>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPaymentStatusBadge(
                                order.payment_status
                              )}`}
                            >
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOrderStatusBadge(
                                order.order_status
                              )}`}
                            >
                              {order.order_status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-display font-bold text-text-main">
                            {formatNaira(order.total_amount)}
                          </td>
                          <td className="py-3.5 text-right">
                            <Link
                              href="/admin/orders"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-surface hover:bg-surface-muted border border-border rounded-lg text-xs font-semibold text-text-main transition-colors"
                            >
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< md screens) */}
              <div className="md:hidden space-y-3">
                {orders.slice(0, 5).map(order => {
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 bg-surface-muted/40 rounded-2xl border border-border/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-brand truncate">
                          {order.order_number}
                        </span>
                        <span className="font-display font-bold text-sm text-text-main">
                          {formatNaira(order.total_amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <p className="font-semibold text-text-main truncate">{order.customer_name}</p>
                          <p className="text-[10px] text-text-muted truncate">{order.customer_email}</p>
                        </div>
                        <span className="text-[10px] text-text-muted flex-shrink-0">{orderDate}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getPaymentStatusBadge(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getOrderStatusBadge(
                              order.order_status
                            )}`}
                          >
                            {order.order_status}
                          </span>
                        </div>
                        <Link
                          href="/admin/orders"
                          className="text-xs text-brand font-bold hover:underline"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Low Stock Section (1 Column) */}
        <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border/80 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="font-display font-bold text-base text-text-main">
                Low Stock
              </h2>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs text-brand hover:underline font-bold"
            >
              Update Stock &rarr;
            </Link>
          </div>

          <p className="text-xs text-text-muted">
            Products that are running low on quantity and need restock.
          </p>

          {lowStockProducts.length === 0 ? (
            <div className="p-5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold">All products are well stocked!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">No immediate restock required.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map(prod => (
                <div
                  key={prod.id}
                  className="p-3 bg-surface-muted/40 rounded-2xl border border-border/80 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-main truncate">{prod.name}</p>
                    <p className="text-[10px] text-text-muted">SKU: {prod.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                        prod.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prod.stock_quantity === 0 ? 'Out of stock' : `${prod.stock_quantity} left`}
                    </span>
                    <Link
                      href="/admin/inventory"
                      className="px-2.5 py-1 bg-surface hover:bg-brand hover:text-white border border-border rounded-lg text-xs font-semibold text-text-main transition-colors"
                    >
                      Update
                    </Link>
                  </div>
                </div>
              ))}

              <Link
                href="/admin/inventory"
                className="w-full py-2 px-3 bg-surface-muted hover:bg-surface text-text-main border border-border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors block text-center"
              >
                <span>Manage All Stock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
