'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  Search,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SiteSettings } from '@/types/cms.types';

export default function AdminSeoSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load SEO settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save SEO settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-text-muted text-xs">
        Loading SEO configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Search Engine Optimization (SEO)
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Configure metadata, OpenGraph social sharing cards, and search indexing for Google Nigeria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SEO Settings Saved!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Metadata'}</span>
          </button>
        </div>
      </div>

      {/* 1. Global Meta Tags */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand" />
          <span>Global Search Engine Meta Tags</span>
        </h2>

        <div>
          <label className="block text-xs font-bold text-text-body mb-1">
            Default Site Title (50-60 characters recommended) *
          </label>
          <input
            type="text"
            required
            value={settings.site_title}
            onChange={e => setSettings({ ...settings, site_title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
          />
          <span className="text-[10px] text-text-muted block mt-1">
            {settings.site_title.length} characters
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-body mb-1">
            Default Meta Description (120-160 characters recommended) *
          </label>
          <textarea
            rows={3}
            required
            value={settings.site_description}
            onChange={e => setSettings({ ...settings, site_description: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
          />
          <span className="text-[10px] text-text-muted block mt-1">
            {settings.site_description.length} characters
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-body mb-1">
            Default OpenGraph Social Banner URL
          </label>
          <input
            type="url"
            value={settings.default_og_image}
            onChange={e => setSettings({ ...settings, default_og_image: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
          />
        </div>
      </div>

      {/* 2. Google Search Preview */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
          <Search className="w-4 h-4 text-brand" />
          <span>Google SERP Snippet Preview</span>
        </h2>

        <div className="p-4 bg-white border border-border rounded-xl font-sans space-y-1">
          <div className="text-[11px] text-[#202124] flex items-center gap-1">
            <span className="font-medium">thebloomingher.com</span>
            <span>›</span>
          </div>
          <p className="text-base text-[#1a0dab] font-medium hover:underline cursor-pointer">
            {settings.site_title || 'TheBloomingHer Care & Wellness'}
          </p>
          <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
            {settings.site_description || 'Nigeria\'s premier period care and intimate wellness store.'}
          </p>
        </div>
      </div>
    </form>
  );
}
