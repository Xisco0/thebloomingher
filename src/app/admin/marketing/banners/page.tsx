'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Tv,
  ImageIcon,
  Smartphone,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import {
  MarketingBanner,
  BannerStatus,
  BannerType,
  BannerPlacement,
} from '@/types/marketing-cms.types';
import { MediaPickerModal } from '@/components/admin/marketing/MediaPickerModal';
import { SmartCTASelector } from '@/components/admin/marketing/SmartCTASelector';
import { BannerPreviewModal } from '@/components/admin/marketing/BannerPreviewModal';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function BannersManagementPage() {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [placementFilter, setPlacementFilter] = useState<string>('all');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<MarketingBanner> | null>(null);
  const [previewBanner, setPreviewBanner] = useState<MarketingBanner | null>(null);

  // Media Picker Trigger State
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'desktop' | 'mobile' | null>(null);

  useEffect(() => {
    fetchBanners();
  }, [statusFilter, typeFilter, placementFilter]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (placementFilter !== 'all') params.set('placement', placementFilter);

      const res = await fetch(`/api/admin/marketing/banners?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners || []);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBanner({
      internal_name: '',
      title: '',
      highlighted_title: '',
      subtitle: '',
      badge_text: '',
      banner_type: 'promotion',
      placement: 'homepage_hero',
      primary_cta: {
        text: 'Shop Now',
        destinationType: 'custom_page',
        url: '/shop',
      },
      desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg',
      mobile_image_url: '',
      alt_text: 'Promotional Banner',
      theme_color: 'plum',
      status: 'active',
      timezone: 'Africa/Lagos',
      priority_order: banners.length + 1,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (banner: MarketingBanner) => {
    setEditingBanner({ ...banner });
    setIsEditorOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.title || !editingBanner.desktop_image_url) {
      alert('Please provide a title and desktop banner image.');
      return;
    }

    try {
      const isUpdating = Boolean(editingBanner.id);
      const res = await fetch('/api/admin/marketing/banners', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        setEditingBanner(null);
        fetchBanners();
      } else {
        alert(data.error || 'Failed to save banner');
      }
    } catch (err) {
      console.error('Save banner error:', err);
      alert('Error saving banner');
    }
  };

  const handleDeleteBanner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/marketing/banners?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBanners(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error('Delete banner error:', err);
    }
  };

  const handleDuplicateBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/marketing/banners/${id}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      }
    } catch (err) {
      console.error('Duplicate banner error:', err);
    }
  };

  const handleMovePriority = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    setBanners(newBanners);

    try {
      await fetch('/api/admin/marketing/banners/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newBanners.map(b => b.id) }),
      });
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  const getStatusBadge = (status: BannerStatus) => {
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
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <span>Expired</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-600">
            <Archive className="w-3 h-3" />
            <span>Archived</span>
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
            Banner & Hero Management
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create, schedule, reorder, and preview rotating hero carousels and promotional page banners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Banner</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-surface rounded-2xl border border-border shadow-subtle flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by internal name, title, or subtitle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchBanners()}
            className="w-full pl-9 pr-3 py-2 bg-surface-muted/50 rounded-xl border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="all">All Banner Types</option>
            <option value="promotion">Promotion</option>
            <option value="product">Product Focus</option>
            <option value="event">Event & RSVP</option>
            <option value="seasonal_campaign">Seasonal Campaign</option>
            <option value="new_arrival">New Arrival</option>
            <option value="announcement">Announcement</option>
            <option value="custom">Custom</option>
          </select>

          {/* Placement Filter */}
          <select
            value={placementFilter}
            onChange={e => setPlacementFilter(e.target.value)}
            className="px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="all">All Placements</option>
            <option value="homepage_hero">Homepage Hero</option>
            <option value="homepage_split_banners">Homepage Split Banners</option>
            <option value="product_listing_banner">Product Listing Page</option>
            <option value="category_page_banner">Category Banner</option>
            <option value="footer_promo">Footer Promo</option>
          </select>
        </div>
      </div>

      {/* Banners List / Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-text-muted">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Tv className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">No banners match your filters</p>
            <p className="text-xs text-text-muted">Create a new banner or adjust your search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {banners.map((b, index) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between hover:bg-surface-muted/30 transition-colors"
              >
                {/* Left: Thumbnail & Main Info */}
                <div className="flex items-start sm:items-center gap-4 flex-1">
                  {/* Priority Reordering Buttons */}
                  <div className="flex flex-col items-center justify-center gap-1 text-text-muted">
                    <button
                      onClick={() => handleMovePriority(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-surface-muted hover:text-brand disabled:opacity-20"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <span className="text-[11px] font-bold text-text-main font-mono">#{b.priority_order}</span>
                    <button
                      onClick={() => handleMovePriority(index, 'down')}
                      disabled={index === banners.length - 1}
                      className="p-1 rounded hover:bg-surface-muted hover:text-brand disabled:opacity-20"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Creative Image Preview */}
                  <div className="relative w-20 h-14 sm:w-28 sm:h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-border shadow-xs">
                    <Image
                      src={b.desktop_image_url}
                      alt={b.alt_text || b.title}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>

                  {/* Titles & Type */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-text-main">{b.internal_name}</h3>
                      {getStatusBadge(b.status)}
                    </div>

                    <p className="text-xs text-text-muted line-clamp-1">
                      <span className="text-text-main font-semibold">&ldquo;{b.title} {b.highlighted_title}&rdquo;</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
                      <span>Placement: <span className="font-semibold text-text-main capitalize">{b.placement.replace(/_/g, ' ')}</span></span>
                      <span>Type: <span className="font-semibold text-text-main capitalize">{b.banner_type.replace(/_/g, ' ')}</span></span>
                      <span>CTA: <span className="text-brand font-semibold">{b.primary_cta.text}</span> → {b.primary_cta.url}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                  <button
                    onClick={() => setPreviewBanner(b)}
                    className="p-2 rounded-xl bg-surface hover:bg-brand-light text-text-body hover:text-brand border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Real-Time Device Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateBanner(b.id)}
                    className="p-2 rounded-xl bg-surface hover:bg-surface-muted text-text-body border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Duplicate Banner"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-2 rounded-xl bg-surface hover:bg-brand text-text-body hover:text-white border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBanner(b.id, b.internal_name)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Drawer Modal */}
      {isEditorOpen && editingBanner && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex-shrink-0">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  Banner Composer
                </span>
                <h3 className="font-display font-bold text-lg text-text-main">
                  {editingBanner.id ? 'Edit Marketing Banner' : 'Create New Marketing Banner'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-border/80 pb-2">
                  1. Basic Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">
                      Internal Admin Name <span className="text-brand">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hero Slide 1 - March Flash Deal"
                      value={editingBanner.internal_name || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, internal_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">
                      Banner Type
                    </label>
                    <select
                      value={editingBanner.banner_type || 'promotion'}
                      onChange={e => setEditingBanner({ ...editingBanner, banner_type: e.target.value as BannerType })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    >
                      <option value="promotion">Promotion</option>
                      <option value="product">Product Focus</option>
                      <option value="event">Event & Community</option>
                      <option value="seasonal_campaign">Seasonal Campaign</option>
                      <option value="new_arrival">New Arrival</option>
                      <option value="announcement">Announcement</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">
                      Display Placement
                    </label>
                    <select
                      value={editingBanner.placement || 'homepage_hero'}
                      onChange={e => setEditingBanner({ ...editingBanner, placement: e.target.value as BannerPlacement })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    >
                      <option value="homepage_hero">Homepage Hero (Rotating Carousel)</option>
                      <option value="homepage_split_banners">Homepage Split Promotional Banner</option>
                      <option value="product_listing_banner">Product Listing Page Header Banner</option>
                      <option value="category_page_banner">Category Page Banner</option>
                      <option value="footer_promo">Footer Promo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">
                      Badge Text (Pill tag above title)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FEMININE CARE • WELLNESS • EVERYDAY ESSENTIALS"
                      value={editingBanner.badge_text || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, badge_text: e.target.value })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">
                      Public Headline <span className="text-brand">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thoughtfully selected essentials for your"
                      value={editingBanner.title || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">
                      Highlighted / Italic Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. care, comfort & lifestyle."
                      value={editingBanner.highlighted_title || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, highlighted_title: e.target.value })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">
                    Subtitle / Promotional Copy
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Quality products for a healthier, happier you. Delivered across Lagos and Nigeria."
                    value={editingBanner.subtitle || ''}
                    onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Media Creative */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-border/80 pb-2">
                  2. Media & Device Creatives
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Desktop Creative */}
                  <div className="p-4 bg-surface-muted/30 rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-brand" />
                        <span>Desktop Image <span className="text-brand">*</span></span>
                      </label>
                      <span className="text-[10px] text-text-muted font-semibold">16:9 or 4:3 (High-Res)</span>
                    </div>

                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100 border border-border">
                      {editingBanner.desktop_image_url ? (
                        <Image
                          src={editingBanner.desktop_image_url}
                          alt="Desktop banner"
                          fill
                          sizes="300px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-text-muted">
                          No image selected
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('desktop')}
                      className="w-full py-2 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choose from Media Library</span>
                    </button>
                  </div>

                  {/* Mobile Creative */}
                  <div className="p-4 bg-surface-muted/30 rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-brand" />
                        <span>Dedicated Mobile Creative</span>
                      </label>
                      <span className="text-[10px] text-text-muted font-semibold">Square or 4:5 Portrait</span>
                    </div>

                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100 border border-border">
                      {editingBanner.mobile_image_url ? (
                        <Image
                          src={editingBanner.mobile_image_url}
                          alt="Mobile banner"
                          fill
                          sizes="300px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[11px] text-text-muted p-2 text-center">
                          <span>(Optional dedicated mobile image)</span>
                          <span className="text-[10px]">Defaults to desktop if empty</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('mobile')}
                      className="w-full py-2 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choose Mobile Image</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Smart CTAs */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-border/80 pb-2">
                  3. Call-to-Action Buttons
                </h4>

                <SmartCTASelector
                  label="Primary Button"
                  cta={editingBanner.primary_cta || { text: 'Shop Now', destinationType: 'custom_page', url: '/shop' }}
                  onChange={cta => setEditingBanner({ ...editingBanner, primary_cta: cta })}
                  required={true}
                />
              </div>

              {/* Scheduling & Status */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-border/80 pb-2">
                  4. Automated Scheduling & Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">Status</label>
                    <select
                      value={editingBanner.status || 'draft'}
                      onChange={e => setEditingBanner({ ...editingBanner, status: e.target.value as BannerStatus })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="paused">Paused (Temporarily Hidden)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={editingBanner.start_date ? editingBanner.start_date.substring(0, 16) : ''}
                      onChange={e => setEditingBanner({ ...editingBanner, start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-main block mb-1">End Date (Auto-Expires)</label>
                    <input
                      type="datetime-local"
                      value={editingBanner.end_date ? editingBanner.end_date.substring(0, 16) : ''}
                      onChange={e => setEditingBanner({ ...editingBanner, end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
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
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal Trigger */}
      <MediaPickerModal
        isOpen={Boolean(mediaPickerTarget)}
        onClose={() => setMediaPickerTarget(null)}
        title={mediaPickerTarget === 'mobile' ? 'Choose Mobile Creative' : 'Choose Desktop Banner Image'}
        recommendedAspect={mediaPickerTarget === 'mobile' ? '1:1 Square or 4:5 Portrait' : '16:9 or 4:3 Widescreen'}
        onSelect={url => {
          if (mediaPickerTarget === 'desktop') {
            setEditingBanner(prev => prev ? { ...prev, desktop_image_url: url } : null);
          } else if (mediaPickerTarget === 'mobile') {
            setEditingBanner(prev => prev ? { ...prev, mobile_image_url: url } : null);
          }
        }}
      />

      {/* Real-time Multi-Device Preview Modal */}
      <BannerPreviewModal
        banner={previewBanner}
        isOpen={Boolean(previewBanner)}
        onClose={() => setPreviewBanner(null)}
      />
    </div>
  );
}
