'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Flag,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Tv,
  Tags,
  Ticket,
  Megaphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
} from 'lucide-react';
import { MarketingCampaign, CampaignStatus } from '@/types/marketing-cms.types';
import { MediaPickerModal } from '@/components/admin/marketing/MediaPickerModal';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function CampaignsManagementPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<MarketingCampaign> | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCampaign({
      name: '',
      description: '',
      cover_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg',
      status: 'active',
      timezone: 'Africa/Lagos',
      banner_ids: [],
      promotion_ids: [],
      coupon_ids: [],
      announcement_ids: [],
      featured_product_ids: [],
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (campaign: MarketingCampaign) => {
    setEditingCampaign({ ...campaign });
    setIsEditorOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign?.name) {
      alert('Campaign name is required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCampaign),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        setEditingCampaign(null);
        fetchCampaigns();
      } else {
        alert(data.error || 'Failed to save campaign');
      }
    } catch (err) {
      console.error('Save campaign error:', err);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/marketing/campaigns?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Delete campaign error:', err);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            <span>Scheduled</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
            <span>Draft</span>
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            <span>Paused</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600">
            <span>{status}</span>
          </span>
        );
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
            Campaigns Hub
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Bundle hero slides, promo discounts, announcements, and coupons into comprehensive seasonal campaigns.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-16 text-center text-xs text-text-muted">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-2 p-16 text-center space-y-3 bg-surface rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Flag className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">No campaigns created yet</p>
            <p className="text-xs text-text-muted">Launch your first seasonal marketing campaign.</p>
          </div>
        ) : (
          campaigns.map(c => (
            <div
              key={c.id}
              className="bg-surface rounded-2xl border border-border/80 shadow-subtle hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Cover Image & Header */}
              <div>
                {c.cover_image_url && (
                  <div className="relative aspect-[21/9] w-full bg-neutral-100 overflow-hidden border-b border-border/60">
                    <Image
                      src={c.cover_image_url}
                      alt={c.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3">{getStatusBadge(c.status)}</div>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-3">
                  <h3 className="font-display font-bold text-lg text-text-main">{c.name}</h3>
                  <p className="text-xs text-text-body/80 leading-relaxed">{c.description}</p>

                  {/* Connected Content Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-surface-muted/50 text-center border border-border/50">
                      <Tv className="w-4 h-4 text-brand mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-text-main block">{c.banner_ids.length}</span>
                      <span className="text-[9px] text-text-muted uppercase">Banners</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-muted/50 text-center border border-border/50">
                      <Tags className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-text-main block">{c.promotion_ids.length}</span>
                      <span className="text-[9px] text-text-muted uppercase">Promotions</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-muted/50 text-center border border-border/50">
                      <Ticket className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-text-main block">{c.coupon_ids.length}</span>
                      <span className="text-[9px] text-text-muted uppercase">Coupons</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-muted/50 text-center border border-border/50">
                      <Package className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-text-main block">{c.featured_product_ids.length}</span>
                      <span className="text-[9px] text-text-muted uppercase">Products</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer / Actions */}
              <div className="p-4 sm:p-5 border-t border-border/60 bg-surface-muted/30 flex items-center justify-between">
                <div className="text-[11px] text-text-muted">
                  Schedule: <span className="font-semibold text-text-main">{c.start_date ? new Date(c.start_date).toLocaleDateString() : 'Immediate'} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : 'Ongoing'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-2 rounded-xl bg-surface hover:bg-brand text-text-body hover:text-white border border-border text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCampaign(c.id, c.name)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
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
      {isEditorOpen && editingCampaign && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex-shrink-0">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="font-display font-bold text-lg text-text-main">
                {editingCampaign.id ? 'Edit Marketing Campaign' : 'Create Marketing Campaign'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-muted">✕</button>
            </div>

            <form onSubmit={handleSaveCampaign} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Campaign Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Black Friday 2026, September Wellness Month"
                  value={editingCampaign.name || ''}
                  onChange={e => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingCampaign({ ...editingCampaign, name, slug: editingCampaign.slug || autoSlug });
                  }}
                  required
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-main">Campaign Handle / Slug</label>
                  <span className="text-[10px] text-text-muted">Auto-generated from name</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[11px] text-text-muted font-mono select-none">
                    /campaigns/
                  </span>
                  <input
                    type="text"
                    placeholder="september-wellness-care"
                    value={editingCampaign.slug || ''}
                    onChange={e => setEditingCampaign({
                      ...editingCampaign,
                      slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    })}
                    className="w-full pl-[92px] pr-3 py-2 bg-surface rounded-xl border border-border text-xs font-mono text-brand focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Campaign goals, promotional focus, and customer messaging..."
                  value={editingCampaign.description || ''}
                  onChange={e => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingCampaign.cover_image_url || ''}
                    onChange={e => setEditingCampaign({ ...editingCampaign, cover_image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="px-3 py-2 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-xl text-xs font-semibold whitespace-nowrap"
                  >
                    Select Image
                  </button>
                </div>
              </div>

              {/* Status & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Status</label>
                  <select
                    value={editingCampaign.status || 'active'}
                    onChange={e => setEditingCampaign({ ...editingCampaign, status: e.target.value as CampaignStatus })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  >
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={editingCampaign.start_date ? editingCampaign.start_date.substring(0, 16) : ''}
                    onChange={e => setEditingCampaign({ ...editingCampaign, start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={editingCampaign.end_date ? editingCampaign.end_date.substring(0, 16) : ''}
                    onChange={e => setEditingCampaign({ ...editingCampaign, end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-body hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={url => setEditingCampaign(prev => prev ? { ...prev, cover_image_url: url } : null)}
      />
    </div>
  );
}
