'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Ticket,
  Percent,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { DiscountCoupon } from '@/types/cms.types';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function MarketingCouponsPage() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: 10,
    min_spend: 15000,
    max_discount: 5000,
    usage_limit: 500,
    is_active: true,
    first_order_only: false,
    start_date: '',
    end_date: '',
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/discounts');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.discounts || []);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (coupon: DiscountCoupon) => {
    try {
      const updated = { ...coupon, is_active: !coupon.is_active };
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.map(c => (c.id === coupon.id ? data.discount : c)));
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => [data.discount, ...prev]);
        setShowModal(false);
        setFormData({
          code: '',
          type: 'percentage',
          value: 10,
          min_spend: 15000,
          max_discount: 5000,
          usage_limit: 500,
          is_active: true,
          first_order_only: false,
          start_date: '',
          end_date: '',
        });
      }
    } catch (err) {
      console.error('Failed to create coupon:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <MarketingSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Content & Marketing CMS
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Coupons & Discount Codes
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create percentage and fixed-amount promotional vouchers for checkout campaigns.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon Code</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-16 text-center text-xs text-text-muted">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="col-span-3 p-16 text-center space-y-3 bg-surface rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Ticket className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">No coupon codes found</p>
            <p className="text-xs text-text-muted">Create discount codes to incentivize new and returning customers.</p>
          </div>
        ) : (
          coupons.map(coupon => (
            <div
              key={coupon.id}
              className="bg-surface rounded-2xl border border-border/80 shadow-subtle p-5 flex flex-col justify-between space-y-4 hover:shadow-card-hover transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-brand-light text-brand font-mono font-bold text-xs rounded-xl border border-brand/20 tracking-wider">
                    {coupon.code}
                  </span>

                  <button
                    onClick={() => handleToggleActive(coupon)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      coupon.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {coupon.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div>
                  <div className="text-xl font-display font-bold text-text-main">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₦${coupon.value.toLocaleString()} OFF`}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {coupon.min_spend ? `Min spend: ₦${coupon.min_spend.toLocaleString()}` : 'No minimum spend'}
                  </div>
                </div>

                <div className="text-[11px] text-text-muted space-y-1 pt-2 border-t border-border/50">
                  <div className="flex justify-between">
                    <span>Usage Count:</span>
                    <span className="font-semibold text-text-main font-mono">
                      {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'uses'}
                    </span>
                  </div>
                  {coupon.first_order_only && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                      First Order Only
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-text-muted">
                  {coupon.end_date ? `Expires: ${coupon.end_date}` : 'No expiration date'}
                </span>

                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 my-auto flex-shrink-0 max-h-[calc(100dvh-2.5rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display font-bold text-base text-text-main">Create Discount Code</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-surface-muted text-text-muted">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELLNESS15"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs font-mono font-bold text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Minimum Spend (₦)</label>
                  <input
                    type="number"
                    value={formData.min_spend}
                    onChange={e => setFormData({ ...formData, min_spend: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="firstOrder"
                  checked={formData.first_order_only}
                  onChange={e => setFormData({ ...formData, first_order_only: e.target.checked })}
                  className="w-4 h-4 rounded text-brand focus:ring-brand"
                />
                <label htmlFor="firstOrder" className="text-xs font-semibold text-text-main cursor-pointer">
                  First-time customers only
                </label>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-body hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-semibold shadow-md"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
