'use client';

import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  Calendar,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { DiscountCoupon } from '@/types/cms.types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: 10,
    min_spend: 15000,
    max_discount: 5000,
    usage_limit: 500,
    is_active: true,
    first_order_only: false,
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/discounts');
      const data = await res.json();
      if (data.success) {
        setDiscounts(data.discounts || []);
      }
    } catch (err) {
      console.error('Failed to load discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (discount: DiscountCoupon) => {
    try {
      const updated = { ...discount, is_active: !discount.is_active };
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setDiscounts(prev => prev.map(d => (d.id === discount.id ? data.discount : d)));
      }
    } catch (err) {
      console.error('Failed to toggle discount:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this discount code?')) return;
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDiscounts(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete discount:', err);
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
        setDiscounts(prev => [data.discount, ...prev]);
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
        });
      }
    } catch (err) {
      console.error('Failed to create discount:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Discounts & Coupons
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create promotional coupon codes with minimum order limits and usage tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiscounts}
            disabled={loading}
            className="p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* New Coupon Modal */}
      {showModal && (
        <div className="bg-surface p-6 rounded-2xl border-2 border-brand/30 shadow-md space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-display font-bold text-base text-text-main">
              Create Promotional Discount Coupon
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-xs text-text-muted hover:text-text-main font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLOOM20"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Discount Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand font-semibold"
                >
                  <option value="percentage">Percentage Off (%)</option>
                  <option value="fixed_amount">Fixed Amount Off (₦)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  {formData.type === 'percentage' ? 'Percentage Value (%)' : 'Amount Value (₦)'} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Min Spend (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_spend}
                  onChange={e => setFormData({ ...formData, min_spend: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={e => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.first_order_only}
                  onChange={e => setFormData({ ...formData, first_order_only: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                />
                <span className="text-xs font-semibold text-text-main">First Order Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                />
                <span className="text-xs font-semibold text-text-main">Active Immediately</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-body"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min. Spend</th>
                <th className="py-3.5 px-4">Usage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {discounts.map(discount => (
                <tr key={discount.id} className="hover:bg-surface-muted/40 transition-colors">
                  {/* Code */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-mono font-bold text-brand bg-brand-light/60 px-2 py-1 rounded-md text-xs border border-brand/20">
                        {discount.code}
                      </span>
                      <button
                        onClick={() => handleCopy(discount.code)}
                        className="text-text-muted hover:text-brand"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {copiedCode === discount.code && (
                        <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                      )}
                    </div>
                  </td>

                  {/* Discount */}
                  <td className="py-3.5 px-4 font-bold text-text-main">
                    {discount.type === 'percentage'
                      ? `${discount.value}% OFF`
                      : `${formatNaira(discount.value)} OFF`}
                  </td>

                  {/* Min Spend */}
                  <td className="py-3.5 px-4 text-text-body font-mono">
                    {discount.min_spend ? formatNaira(discount.min_spend) : 'No minimum'}
                  </td>

                  {/* Usage */}
                  <td className="py-3.5 px-4 text-text-muted">
                    <span className="font-bold text-text-main">{discount.usage_count}</span>
                    {discount.usage_limit ? ` / ${discount.usage_limit} used` : ' uses'}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(discount)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        discount.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-surface-muted text-text-muted border border-border'
                      }`}
                    >
                      {discount.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete discount"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
