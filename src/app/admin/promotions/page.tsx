'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { PromotionCampaign } from '@/types/cms.types';
import Link from 'next/link';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cta_text: 'Shop Now',
    cta_link: '/shop',
    discount_percentage: 15,
    placement: 'homepage' as 'homepage' | 'category' | 'product_banner' | 'global',
    is_active: true,
  });

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleToggleActive = async (promo: PromotionCampaign) => {
    try {
      const updated = { ...promo, is_active: !promo.is_active };
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setPromotions(prev => prev.map(p => (p.id === promo.id ? data.promotion : p)));
      }
    } catch (err) {
      console.error('Failed to toggle promotion:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPromotions(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete promotion:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setPromotions(prev => [data.promotion, ...prev]);
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          cta_text: 'Shop Now',
          cta_link: '/shop',
          discount_percentage: 15,
          placement: 'homepage',
          is_active: true,
        });
      }
    } catch (err) {
      console.error('Failed to create promotion:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Promotional Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Flash sales, seasonal period care bundles, and sitewide announcement banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPromotions}
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
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* New Campaign Modal */}
      {showModal && (
        <div className="bg-surface p-6 rounded-2xl border-2 border-brand/30 shadow-md space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-display font-bold text-base text-text-main">
              New Promotional Campaign
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-xs text-text-muted hover:text-text-main font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Campaign Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. End of Month Wellness Bundle Discount"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Description / Tagline</label>
              <input
                type="text"
                placeholder="e.g. Buy 2 boxes of organic liners and get 15% off automatically."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">CTA Destination Link</label>
                <input
                  type="text"
                  value={formData.cta_link}
                  onChange={e => setFormData({ ...formData, cta_link: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Placement Target</label>
                <select
                  value={formData.placement}
                  onChange={e => setFormData({ ...formData, placement: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand font-semibold"
                >
                  <option value="homepage">Homepage Hero / Banner</option>
                  <option value="global">Global Top Announcement Bar</option>
                  <option value="category">Category Page Header</option>
                  <option value="product_banner">Product Details Banner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Discount % (Optional)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={e => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
              </div>
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
                Publish Campaign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map(promo => (
          <div
            key={promo.id}
            className="bg-surface rounded-2xl border border-border/80 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-brand/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-light text-brand uppercase tracking-wider">
                  {promo.placement}
                </span>

                <button
                  onClick={() => handleToggleActive(promo)}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    promo.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-surface-muted text-text-muted border border-border'
                  }`}
                >
                  {promo.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-text-main">{promo.title}</h3>
                <p className="text-xs text-text-body mt-1 leading-relaxed">
                  {promo.description || 'Exclusive promotional offer for customer orders.'}
                </p>
              </div>

              {promo.discount_percentage && (
                <div className="inline-block px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-100">
                  {promo.discount_percentage}% OFF APPLIED
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <Link
                href={promo.cta_link || '/shop'}
                target="_blank"
                className="text-brand font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>{promo.cta_text || 'View Link'}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                onClick={() => handleDelete(promo.id)}
                className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete campaign"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
