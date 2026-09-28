'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  Save,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { HomepageConfig } from '@/types/cms.types';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default function AdminHomepageContentPage() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load homepage content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save homepage config:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-text-muted text-xs">
        Loading homepage configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Homepage Content Management
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Customize the storefront announcement bar, hero section headlines, split banners, and visual copy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved & Live!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* 1. Global Announcement Bar */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <span>Top Announcement Bar</span>
        </h2>
        <div>
          <label className="block text-xs font-bold text-text-body mb-1">
            Announcement Text (Shown across all customer pages)
          </label>
          <input
            type="text"
            required
            value={config.announcementText}
            onChange={e => setConfig({ ...config, announcementText: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
          />
        </div>
      </div>

      {/* 2. Hero Section */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-text-main">Hero Banner Section</h2>

        {config.heroSlides.map((slide, idx) => (
          <div key={slide.id || idx} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Badge Tagline</label>
              <input
                type="text"
                value={slide.badge}
                onChange={e => {
                  const updated = [...config.heroSlides];
                  updated[idx].badge = e.target.value;
                  setConfig({ ...config, heroSlides: updated });
                }}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Headline (Part 1)</label>
                <input
                  type="text"
                  value={slide.title}
                  onChange={e => {
                    const updated = [...config.heroSlides];
                    updated[idx].title = e.target.value;
                    setConfig({ ...config, heroSlides: updated });
                  }}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Highlighted Title (Plum Color)</label>
                <input
                  type="text"
                  value={slide.highlightedTitle}
                  onChange={e => {
                    const updated = [...config.heroSlides];
                    updated[idx].highlightedTitle = e.target.value;
                    setConfig({ ...config, heroSlides: updated });
                  }}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand font-bold text-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Hero Subtitle</label>
              <textarea
                rows={2}
                value={slide.subtitle}
                onChange={e => {
                  const updated = [...config.heroSlides];
                  updated[idx].subtitle = e.target.value;
                  setConfig({ ...config, heroSlides: updated });
                }}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Primary Button Text</label>
                <input
                  type="text"
                  value={slide.primaryCtaText}
                  onChange={e => {
                    const updated = [...config.heroSlides];
                    updated[idx].primaryCtaText = e.target.value;
                    setConfig({ ...config, heroSlides: updated });
                  }}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Primary Button Link</label>
                <input
                  type="text"
                  value={slide.primaryCtaLink}
                  onChange={e => {
                    const updated = [...config.heroSlides];
                    updated[idx].primaryCtaLink = e.target.value;
                    setConfig({ ...config, heroSlides: updated });
                  }}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>
            </div>

            <div className="pt-2">
              <ImageUploader
                value={slide.imageUrl ? [slide.imageUrl] : []}
                onChange={urls => {
                  const updated = [...config.heroSlides];
                  updated[idx].imageUrl = urls[0] || '';
                  setConfig({ ...config, heroSlides: updated });
                }}
                folder="banners"
                maxFiles={1}
                label="Hero Background / Lifestyle Image"
                description="Upload hero lifestyle photo."
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Split Promo Banners */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-text-main">Featured Split Promo Banners</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left Card */}
          <div className="p-4 bg-surface-muted/40 rounded-xl border border-border space-y-3">
            <h3 className="font-bold text-xs text-brand uppercase">Left Banner</h3>
            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Title</label>
              <input
                type="text"
                value={config.splitBanners.left.title}
                onChange={e =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      left: { ...config.splitBanners.left, title: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Subtitle</label>
              <input
                type="text"
                value={config.splitBanners.left.subtitle}
                onChange={e =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      left: { ...config.splitBanners.left, subtitle: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">CTA Destination</label>
              <input
                type="text"
                value={config.splitBanners.left.ctaLink}
                onChange={e =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      left: { ...config.splitBanners.left, ctaLink: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-text-main"
              />
            </div>

            <div className="pt-2">
              <ImageUploader
                value={config.splitBanners.left.imageUrl ? [config.splitBanners.left.imageUrl] : []}
                onChange={urls =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      left: { ...config.splitBanners.left, imageUrl: urls[0] || '' },
                    },
                  })
                }
                folder="banners"
                maxFiles={1}
                label="Left Banner Image"
                description="Upload image for Left split banner (R2)."
              />
            </div>
          </div>

          {/* Right Card */}
          <div className="p-4 bg-surface-muted/40 rounded-xl border border-border space-y-3">
            <h3 className="font-bold text-xs text-brand uppercase">Right Banner</h3>
            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Title</label>
              <input
                type="text"
                value={config.splitBanners.right.title}
                onChange={e =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      right: { ...config.splitBanners.right, title: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Subtitle</label>
              <input
                type="text"
                value={config.splitBanners.right.subtitle}
                onChange={e =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      right: { ...config.splitBanners.right, subtitle: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">CTA Destination</label>
              <input
                type="text"
                value={config.splitBanners.right.ctaLink}
                onChange={e =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      right: { ...config.splitBanners.right, ctaLink: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono text-text-main"
              />
            </div>

            <div className="pt-2">
              <ImageUploader
                value={config.splitBanners.right.imageUrl ? [config.splitBanners.right.imageUrl] : []}
                onChange={urls =>
                  setConfig({
                    ...config,
                    splitBanners: {
                      ...config.splitBanners,
                      right: { ...config.splitBanners.right, imageUrl: urls[0] || '' },
                    },
                  })
                }
                folder="banners"
                maxFiles={1}
                label="Right Banner Image"
                description="Upload image for Right split banner (R2)."
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
