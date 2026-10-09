'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Sparkles,
  RefreshCw,
  Award,
  Calendar,
  Filter,
  ArrowUpRight,
  CreditCard,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { Order, Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'last3' | 'last6' | 'q1' | 'q2' | 'q3'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '0'..'11'
  const [statusFilter, setStatusFilter] = useState<'paid' | 'all'>('paid');
  const [activeHoverMonth, setActiveHoverMonth] = useState<number | null>(null);

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

  // Filter orders according to payment status
  const baseOrders = useMemo(() => {
    if (statusFilter === 'paid') {
      return orders.filter(o => o.payment_status === 'paid' || o.payment_status === 'successful');
    }
    return orders;
  }, [orders, statusFilter]);

  const currentYear = new Date().getFullYear();

  // Generate 12 months data bucket for current year
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      shortName: SHORT_MONTHS[i],
      revenue: 0,
      orderCount: 0,
      orders: [] as Order[],
    }));

    baseOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const m = orderDate.getMonth(); // 0 to 11
      if (m >= 0 && m < 12) {
        months[m].revenue += order.total_amount;
        months[m].orderCount += 1;
        months[m].orders.push(order);
      }
    });

    return months;
  }, [baseOrders]);

  // Determine filtered subset of months
  const filteredMonths = useMemo(() => {
    let result = [...monthlyData];

    if (selectedMonth !== 'all') {
      const mIdx = parseInt(selectedMonth, 10);
      return result.filter(m => m.monthIndex === mIdx);
    }

    const curMonth = new Date().getMonth();

    if (selectedPreset === 'last3') {
      const start = Math.max(0, curMonth - 2);
      result = result.slice(start, curMonth + 1);
    } else if (selectedPreset === 'last6') {
      const start = Math.max(0, curMonth - 5);
      result = result.slice(start, curMonth + 1);
    } else if (selectedPreset === 'q1') {
      result = result.slice(0, 3);
    } else if (selectedPreset === 'q2') {
      result = result.slice(3, 6);
    } else if (selectedPreset === 'q3') {
      result = result.slice(6, 9);
    }

    return result;
  }, [monthlyData, selectedPreset, selectedMonth]);

  // Summary Metrics based on filtered data
  const filteredRevenue = filteredMonths.reduce((sum, m) => sum + m.revenue, 0);
  const filteredOrdersCount = filteredMonths.reduce((sum, m) => sum + m.orderCount, 0);
  const filteredAOV = filteredOrdersCount > 0 ? Math.round(filteredRevenue / filteredOrdersCount) : 0;

  // Find peak earning month in the chart
  const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);
  const peakMonth = [...monthlyData].sort((a, b) => b.revenue - a.revenue)[0];

  // Filtered Orders array for breakdown tables
  const filteredOrders = useMemo(() => {
    return filteredMonths.flatMap(m => m.orders);
  }, [filteredMonths]);

  // Top Products in the selected period
  const productSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.product_name,
          units: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product_id].units += item.quantity;
      productSalesMap[item.product_id].revenue += item.total_price;
    });
  });
  const sortedTopProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Geographic Distribution in the selected period
  const locationMap: Record<string, { count: number; spend: number }> = {};
  filteredOrders.forEach(o => {
    const loc = o.shipping_address?.state || 'Lagos';
    if (!locationMap[loc]) locationMap[loc] = { count: 0, spend: 0 };
    locationMap[loc].count += 1;
    locationMap[loc].spend += o.total_amount;
  });
  const sortedLocations = Object.entries(locationMap).sort((a, b) => b[1].spend - a[1].spend);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Sales
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Track how much your store has made over time with simple monthly filters.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Sales</span>
        </button>
      </div>

      {/* Interactive Controls & Filters Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-text-muted mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-brand" /> Range:
          </span>
          {[
            { id: 'all', label: 'All 2026' },
            { id: 'last3', label: 'Last 3 Months' },
            { id: 'last6', label: 'Last 6 Months' },
            { id: 'q1', label: 'Q1 (Jan–Mar)' },
            { id: 'q2', label: 'Q2 (Apr–Jun)' },
            { id: 'q3', label: 'Q3 (Jul–Sep)' },
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPreset(preset.id as any);
                setSelectedMonth('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === preset.id && selectedMonth === 'all'
                  ? 'bg-brand text-white shadow-xs font-bold'
                  : 'bg-surface-muted/60 text-text-muted hover:text-text-main hover:bg-surface-muted'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Dropdowns: Specific Month & Payment Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Specific Month Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-muted flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand" /> Month:
            </label>
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
              }}
              className="px-3 py-1.5 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main font-semibold focus:outline-brand"
            >
              <option value="all">All Months</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx.toString()}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-text-muted flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-brand" /> Status:
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main font-semibold focus:outline-brand"
            >
              <option value="paid">Verified Paid Only</option>
              <option value="all">All Orders (Inc. Pending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metric Highlights for the Filtered Timeframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Filtered Revenue</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            {formatNaira(filteredRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {filteredOrdersCount} {statusFilter === 'paid' ? 'Paid' : 'Total'} Checkouts
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Order Value</span>
            <ShoppingBag className="w-5 h-5 text-brand" />
          </div>
          <p className="font-display font-bold text-2xl sm:text-3xl text-brand">
            {formatNaira(filteredAOV)}
          </p>
          <p className="text-xs text-text-muted mt-1">Average per customer basket</p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Best Month</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-purple-700">
            {peakMonth && peakMonth.revenue > 0 ? peakMonth.monthName : 'No Sales Yet'}
          </p>
          <p className="text-xs text-purple-600 font-semibold mt-1">
            {peakMonth && peakMonth.revenue > 0 ? `${formatNaira(peakMonth.revenue)} gross sales` : '₦0 recorded sales'}
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Period</span>
            <Calendar className="w-5 h-5 text-text-muted" />
          </div>
          <p className="font-display font-bold text-lg sm:text-xl text-text-main">
            {selectedMonth !== 'all' ? `${MONTH_NAMES[parseInt(selectedMonth, 10)]} ${currentYear}` : selectedPreset === 'all' ? `Full Year ${currentYear}` : 'Filtered Period'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {filteredMonths.length} {filteredMonths.length === 1 ? 'Month active' : 'Months displayed'}
          </p>
        </div>
      </div>

      {/* Visual Bar Chart Component */}
      <div className="bg-surface rounded-3xl border border-border p-4 sm:p-8 shadow-card space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-text-main flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" />
              <span>Monthly Sales & Revenue Chart (₦)</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Hover or tap any month column to inspect total revenue, order volume, and performance.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-brand" /> Revenue Bar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" /> Peak Month
            </span>
          </div>
        </div>

        {/* Bar Visual Display */}
        <div className="pt-2 sm:pt-4 pb-2">
          <div className="h-56 sm:h-72 flex items-end justify-between gap-1 sm:gap-3 px-1 sm:px-2 border-b border-border">
            {monthlyData.map(m => {
              const heightPercent = maxMonthlyRevenue > 0 ? Math.max(8, (m.revenue / maxMonthlyRevenue) * 100) : 8;
              const isPeak = m.revenue === peakMonth.revenue && m.revenue > 0;
              const isFilteredOut = selectedMonth !== 'all' && m.monthIndex !== parseInt(selectedMonth, 10);
              const isHovered = activeHoverMonth === m.monthIndex;

              return (
                <div
                  key={m.monthIndex}
                  onMouseEnter={() => setActiveHoverMonth(m.monthIndex)}
                  onMouseLeave={() => setActiveHoverMonth(null)}
                  onClick={() => setSelectedMonth(m.monthIndex.toString())}
                  className={`flex-1 flex flex-col items-center justify-end h-full relative group transition-opacity duration-200 cursor-pointer ${
                    isFilteredOut ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  {/* Tooltip on Hover / Tap */}
                  {isHovered && (
                    <div className="absolute -top-16 z-30 bg-surface-dark text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-elevated text-center pointer-events-none min-w-[100px] sm:min-w-[120px] animate-in fade-in zoom-in-95">
                      <p className="text-[9px] sm:text-[10px] text-gray-300 font-bold uppercase">{m.monthName} {currentYear}</p>
                      <p className="font-display font-bold text-xs text-emerald-400">{formatNaira(m.revenue)}</p>
                      <p className="text-[8px] sm:text-[9px] text-gray-300">{m.orderCount} orders</p>
                    </div>
                  )}

                  {/* Revenue Amount Label above bar (visible on medium+ screens) */}
                  <div className="hidden sm:block text-[10px] font-bold text-text-muted mb-1 text-center truncate max-w-full">
                    {m.revenue > 0 ? formatNaira(m.revenue).replace('₦', '₦') : '—'}
                  </div>

                  {/* Bar Column */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[48px] rounded-t-lg sm:rounded-t-xl transition-all duration-300 shadow-subtle flex flex-col justify-end p-0.5 sm:p-1 ${
                      isPeak
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-110'
                        : m.revenue > 0
                        ? 'bg-gradient-to-t from-brand to-brand/80 hover:bg-brand-dark'
                        : 'bg-surface-muted border border-border/80'
                    }`}
                  >
                    {m.orderCount > 0 && (
                      <span className="text-[9px] font-bold text-white text-center hidden md:block">
                        {m.orderCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Month Labels */}
          <div className="flex items-center justify-between gap-1 sm:gap-3 px-1 sm:px-2 pt-2 sm:pt-3">
            {monthlyData.map(m => {
              const isSelected = selectedMonth !== 'all' && m.monthIndex === parseInt(selectedMonth, 10);
              return (
                <button
                  key={m.monthIndex}
                  onClick={() => {
                    setSelectedMonth(m.monthIndex.toString());
                  }}
                  className={`flex-1 text-center py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-colors min-w-0 ${
                    isSelected
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-text-muted hover:text-brand hover:bg-surface-muted/60'
                  }`}
                >
                  <span className="hidden sm:inline">{m.shortName}</span>
                  <span className="sm:hidden">{m.shortName[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month by Month Detailed Sales Breakdown Table */}
      <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-text-main">
              Month-by-Month Commercial Breakdown
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Detailed breakdown of orders, gross receipts, and average spend for each month.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-brand bg-brand-light px-3 py-1 rounded-full">
            {filteredMonths.length} Months
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Month & Year</th>
                <th className="py-3 px-4 font-bold">Orders Volume</th>
                <th className="py-3 px-4 font-bold">Gross Revenue</th>
                <th className="py-3 px-4 font-bold">Average Order Value</th>
                <th className="py-3 px-4 font-bold text-right">Share of Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMonths.map(m => {
                const sharePercent = filteredRevenue > 0 ? Math.round((m.revenue / filteredRevenue) * 100) : 0;
                const monthAov = m.orderCount > 0 ? Math.round(m.revenue / m.orderCount) : 0;

                return (
                  <tr key={m.monthIndex} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-text-main flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand" />
                      {m.monthName} {currentYear}
                    </td>
                    <td className="py-3.5 px-4 text-text-body font-medium">
                      {m.orderCount} {m.orderCount === 1 ? 'order' : 'orders'}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-display text-text-main">
                      {formatNaira(m.revenue)}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted font-medium">
                      {m.orderCount > 0 ? formatNaira(monthAov) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-surface-muted rounded-full h-2 overflow-hidden border border-border">
                          <div
                            className="bg-brand h-full rounded-full"
                            style={{ width: `${sharePercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-text-main w-8">{sharePercent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Analytics: Top Products & Regional Delivery Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Top Selling Products */}
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Top Remedies by Revenue (Filtered)</span>
            </h2>
            <span className="text-xs text-text-muted font-mono">{sortedTopProducts.length} items</span>
          </div>

          {sortedTopProducts.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface-muted/40 rounded-2xl">
              No product purchase signals recorded for this timeframe.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTopProducts.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-surface-muted/50 rounded-2xl border border-border/80 flex items-center justify-between"
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
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              <span>Geographic Destination Breakdown</span>
            </h2>
            <span className="text-xs text-text-muted font-mono">Nigeria</span>
          </div>

          {sortedLocations.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface-muted/40 rounded-2xl">
              No regional delivery signals recorded for this timeframe.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedLocations.slice(0, 5).map(([loc, data]) => (
                <div
                  key={loc}
                  className="p-3.5 bg-surface-muted/50 rounded-2xl border border-border/80 flex items-center justify-between"
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
                      {filteredRevenue > 0 ? `${Math.round((data.spend / filteredRevenue) * 100)}% of period` : '0%'}
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

