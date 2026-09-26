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
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Flag,
  Calendar,
  Tv,
  Tags,
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

  const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid');
  const pendingFulfillmentOrders = orders.filter(
    o => o.payment_status === 'paid' && (o.order_status === 'paid' || o.order_status === 'processing')
  );
  const completedOrders = orders.filter(o => o.order_status === 'delivered');

  const uniqueCustomerEmails = new Set(orders.map(o => o.customer_email.toLowerCase())).size;
  const lowStockProducts = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 10));
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

  const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

  const perms = currentAdmin?.permissions || [];
  const isSuper = currentAdmin?.role === 'super_admin' || perms.includes('*');
  const canManageAdmins = isSuper || perms.includes('admins.manage') || perms.includes('admins.view');
  const canManageMarketing = isSuper || perms.includes('banners.manage') || perms.includes('campaigns.manage');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-6 rounded-3xl border border-border shadow-xs">
        <div>
          {currentAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-light text-brand rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Logged in as {currentAdmin.role_name || currentAdmin.role}</span>
            </div>
          )}
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Welcome back{currentAdmin?.full_name ? `, ${currentAdmin.full_name}` : ''}
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Real-time commercial performance, inventory alerts, and quick RBAC controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="inline-flex bg-surface-muted p-1 rounded-xl border border-border text-xs font-semibold">
            {(['today', '7d', '30d', 'all'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-surface text-brand shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {tf === 'today' && 'Today'}
                {tf === '7d' && 'Last 7D'}
                {tf === '30d' && 'Last 30D'}
                {tf === 'all' && 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Sales */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs hover:border-brand/30 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue ({timeframe.toUpperCase()})</span>
            <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center text-brand">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {formatNaira(totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
            <span>Today: {formatNaira(todayRevenue)}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs hover:border-brand/30 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {filteredOrders.length}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
            <span className="font-semibold text-text-body">{paidOrders.length}</span> paid ({aov > 0 ? `AOV: ${formatNaira(aov)}` : '0 AOV'})
          </div>
        </div>

        {/* Pending Fulfillment */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">To Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-amber-600">
            {pendingFulfillmentOrders.length}
          </p>
          <Link href="/admin/orders" className="text-xs text-amber-700 hover:underline font-semibold mt-2 inline-block">
            View orders to ship &rarr;
          </Link>
        </div>

        {/* Inventory / Low Stock Alert */}
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs hover:border-rose-400/40 transition-all">
          <div className="flex items-center justify-between text-text-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-rose-600">
            {lowStockProducts.length}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
            <span className="font-semibold text-rose-700">{outOfStockProducts.length}</span> out of stock
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand/5 border border-brand/15 rounded-2xl p-4 sm:p-5">
        <div>
          <span className="text-xs text-brand font-semibold block">Total Store Products</span>
          <span className="font-display font-bold text-lg text-text-main">{products.length} Active Items</span>
        </div>
        <div>
          <span className="text-xs text-brand font-semibold block">Unique Customers</span>
          <span className="font-display font-bold text-lg text-text-main">{uniqueCustomerEmails} Shoppers</span>
        </div>
        <div>
          <span className="text-xs text-brand font-semibold block">Completed Deliveries</span>
          <span className="font-display font-bold text-lg text-text-main">{completedOrders.length} Delivered</span>
        </div>
        <div>
          <span className="text-xs text-brand font-semibold block">Free Shipping Level</span>
          <span className="font-display font-bold text-lg text-text-main">₦40,000 Threshold</span>
        </div>
      </div>

      {/* Main Split Sections: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-text-main">Recent Orders</h2>
              <p className="text-xs text-text-muted">Latest customer purchases and order status</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-brand hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-sm bg-surface-muted/40 rounded-xl border border-border/50">
              No orders found yet. Create a test order through the storefront!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted uppercase tracking-wider font-semibold">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {orders.slice(0, 6).map(order => (
                    <tr key={order.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 font-mono font-bold text-brand">
                        <Link href="/admin/orders" className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-text-main">{order.customer_name}</p>
                        <p className="text-[10px] text-text-muted">{order.shipping_address?.state || 'Lagos'}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.order_status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.order_status === 'shipped'
                              ? 'bg-blue-50 text-blue-700'
                              : order.order_status === 'processing'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-display font-bold text-text-main">
                        {formatNaira(order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Low Stock Warnings & Quick Links */}
        <div className="space-y-6">
          {/* Low Stock Widget */}
          <div className="bg-surface rounded-2xl border border-border/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Restock Required</span>
              </h2>
              <Link
                href="/admin/inventory"
                className="text-xs text-brand hover:underline font-bold"
              >
                Inventory &rarr;
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>All inventory items are currently well stocked!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 4).map(prod => (
                  <div
                    key={prod.id}
                    className="p-3 bg-surface-muted/60 rounded-xl border border-border flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-semibold text-text-main truncate">{prod.name}</p>
                      <p className="text-[10px] text-text-muted font-mono">{prod.sku}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          prod.stock_quantity === 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {prod.stock_quantity} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Shortcuts */}
          <div className="bg-brand-light/40 border border-brand/20 rounded-2xl p-6 space-y-3">
            <h3 className="font-display font-bold text-sm text-brand flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Role Shortcuts</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {canManageAdmins && (
                <Link
                  href="/admin/administrators"
                  className="p-2.5 bg-surface hover:bg-surface-muted text-text-main font-semibold rounded-xl border border-border flex items-center justify-between transition-colors"
                >
                  <span>Manage Administrators & RBAC</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              )}
              {canManageMarketing && (
                <Link
                  href="/admin/marketing/banners"
                  className="p-2.5 bg-surface hover:bg-surface-muted text-text-main font-semibold rounded-xl border border-border flex items-center justify-between transition-colors"
                >
                  <span>Hero Banners & Campaigns</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              )}
              <Link
                href="/admin/products/new"
                className="p-2.5 bg-surface hover:bg-surface-muted text-text-main font-semibold rounded-xl border border-border flex items-center justify-between transition-colors"
              >
                <span>+ Add New Product</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>
              <Link
                href="/admin/orders"
                className="p-2.5 bg-surface hover:bg-surface-muted text-text-main font-semibold rounded-xl border border-border flex items-center justify-between transition-colors"
              >
                <span>Process Customer Orders</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
