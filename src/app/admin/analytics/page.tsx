'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Sparkles,
  PieChart,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Order, Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, prodRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/products'),
      ]);
      const ordData = await ordRes.json();
      const prodData = await prodRes.json();

      if (ordData.success) setOrders(ordData.orders || []);
      if (prodData.success) setProducts(prodData.products || []);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const paidOrders = orders.filter(o => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

  // Geographic Distribution
  const locationMap: Record<string, { count: number; spend: number }> = {};
  orders.forEach(o => {
    const loc = o.shipping_address?.state || 'Lagos';
    if (!locationMap[loc]) locationMap[loc] = { count: 0, spend: 0 };
    locationMap[loc].count += 1;
    if (o.payment_status === 'paid') locationMap[loc].spend += o.total_amount;
  });
  const sortedLocations = Object.entries(locationMap).sort((a, b) => b[1].spend - a[1].spend);

  // Best selling products calculation from order items
  const productSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.product_name,
          units: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product_id].units += item.quantity;
      if (order.payment_status === 'paid') {
        productSalesMap[item.product_id].revenue += item.total_price;
      }
    });
  });
  const sortedTopProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Store Performance & Commercial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Revenue trends, Average Order Value (AOV), top performing period care items, and regional distribution.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales (Paid)</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            {formatNaira(totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {paidOrders.length} verified Paystack transactions
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Order Value (AOV)</span>
            <ShoppingBag className="w-5 h-5 text-brand" />
          </div>
          <p className="font-display font-bold text-2xl sm:text-3xl text-brand">
            {formatNaira(aov)}
          </p>
          <p className="text-xs text-text-muted mt-1">Average spend per completed checkout</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Payment Success Rate</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <p className="font-display font-bold text-2xl sm:text-3xl text-purple-700">
            {orders.length > 0 ? `${Math.round((paidOrders.length / orders.length) * 100)}%` : '100%'}
          </p>
          <p className="text-xs text-text-muted mt-1">Paystack cards, transfer & USSD</p>
        </div>
      </div>

      {/* Split Analytics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Top Selling Products */}
        <div className="bg-surface rounded-2xl border border-border/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Top Revenue Generating Products</span>
            </h2>
            <span className="text-xs text-text-muted font-mono">{sortedTopProducts.length} items sold</span>
          </div>

          {sortedTopProducts.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface-muted/40 rounded-xl">
              No product purchase signals recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTopProducts.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-surface-muted/50 rounded-xl border border-border/80 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-text-main truncate">{item.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{item.units} units ordered</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-xs text-text-main">
                      {formatNaira(item.revenue)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Rank #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Geographic Distribution */}
        <div className="bg-surface rounded-2xl border border-border/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <span>Geographic Destination Breakdown</span>
            </h2>
            <span className="text-xs text-text-muted font-mono">Nigeria</span>
          </div>

          {sortedLocations.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface-muted/40 rounded-xl">
              No regional delivery signals recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedLocations.slice(0, 5).map(([loc, data], idx) => (
                <div
                  key={loc}
                  className="p-3.5 bg-surface-muted/50 rounded-xl border border-border/80 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-text-main">{loc}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{data.count} deliveries</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-xs text-emerald-700">
                      {formatNaira(data.spend)}
                    </p>
                    <span className="text-[10px] text-text-muted">
                      {totalRevenue > 0 ? `${Math.round((data.spend / totalRevenue) * 100)}% of sales` : '0%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
