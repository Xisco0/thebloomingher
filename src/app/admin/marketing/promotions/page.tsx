'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Ticket,
  Tv,
} from 'lucide-react';
import { PromotionCampaign } from '@/types/cms.types';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function MarketingPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    cta_text: 'Shop Now',
    cta_link: '/products',
    discount_percentage: 15,
    placement: 'homepage' as 'homepage' | 'category' | 'product_banner' | 'global',
    is_active: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

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

  const handleOpenCreate = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      cta_text: 'Shop Now',
      cta_link: '/products',
      discount_percentage: 15,
      placement: 'homepage',
      is_active: true,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (promo: PromotionCampaign) => {
    setFormData({
      id: promo.id,
      title: promo.title,
      description: promo.description || '',
      cta_text: promo.cta_text || 'Shop Now',
      cta_link: promo.cta_link || '/products',
      discount_percentage: promo.discount_percentage || 0,
      placement: promo.placement,
      is_active: promo.is_active,
    });
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        fetchPromotions();
      }
    } catch (err) {
      console.error('Failed to save promotion:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPromotions(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
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
            Promotions & Flash Offers
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Percentage discounts, bundle highlights, and reusable promotional offers connectable to hero banners.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-16 text-center text-xs text-text-muted">Loading promotions...</div>
        ) : promotions.length === 0 ? (
          <div className="col-span-2 p-16 text-center space-y-3 bg-surface rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Tags className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">No promotions active</p>
            <p className="text-xs text-text-muted">Create a flash sale offer or percentage discount.</p>
          </div>
        ) : (
          promotions.map(promo => (
            <div
              key={promo.id}
              className="bg-surface rounded-2xl border border-border/80 shadow-subtle p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:shadow-card-hover transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-light text-brand uppercase tracking-wider">
                    {promo.placement.replace('_', ' ')}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${promo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-base text-text-main">{promo.title}</h3>
                  <p className="text-xs text-text-body mt-1 leading-relaxed">
                    {promo.description || 'Special promotional discount for customer orders.'}
                  </p>
                </div>

                {promo.discount_percentage ? (
                  <div className="inline-block px-3 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-100">
                    {promo.discount_percentage}% OFF APPLIED
                  </div>
                ) : null}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <Link
                  href={promo.cta_link || '/products'}
                  target="_blank"
                  className="text-brand font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>{promo.cta_text || 'Shop Now'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(promo)}
                    className="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-main"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 my-auto flex-shrink-0 max-h-[calc(100dvh-2.5rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display font-bold text-base text-text-main">
                {formData.id ? 'Edit Promotion' : 'Create Promotion'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 rounded-lg hover:bg-surface-muted text-text-muted">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% Off Selected Wellness Products"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Promotional copy and details..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">CTA Label</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">CTA Destination</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={e => setFormData({ ...formData, cta_link: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={e => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Placement</label>
                  <select
                    value={formData.placement}
                    onChange={e => setFormData({ ...formData, placement: e.target.value as any })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  >
                    <option value="homepage">Homepage</option>
                    <option value="category">Category Page</option>
                    <option value="product_banner">Product Page</option>
                    <option value="global">Global Announcement</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-body hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
