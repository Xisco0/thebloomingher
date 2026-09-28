'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Truck,
  Building,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { SiteSettings } from '@/types/cms.types';
import { formatNaira } from '@/lib/utils/currency';
import { SettingsSubNav } from '@/components/admin/subnav/SettingsSubNav';

export default function AdminSiteSettingsPage() {
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
      console.error('Failed to load settings:', err);
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
        body: JSON.stringify({
          ...settings,
          free_shipping_threshold: Number(settings.free_shipping_threshold),
          lagos_delivery_fee: Number(settings.lagos_delivery_fee),
          nationwide_delivery_fee: Number(settings.nationwide_delivery_fee),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-text-muted text-xs">
        Loading site settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <SettingsSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Store Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Update delivery fees, store address, contact numbers, and WhatsApp support.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Changes saved!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 1. Nigerian Delivery Rates */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand" />
          <span>Delivery Rates & Free Shipping Rule (Nigeria)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-body mb-1">
              Lagos Doorstep Delivery (₦) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={settings.lagos_delivery_fee}
              onChange={e =>
                setSettings({ ...settings, lagos_delivery_fee: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
            />
            <p className="text-[10px] text-text-muted mt-1">Flat fee for 20 Lagos State LGAs</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-body mb-1">
              Nationwide Delivery (₦) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={settings.nationwide_delivery_fee}
              onChange={e =>
                setSettings({ ...settings, nationwide_delivery_fee: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
            />
            <p className="text-[10px] text-text-muted mt-1">All other 35 states & FCT Abuja</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-body mb-1">
              Free Shipping Spend Threshold (₦) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={settings.free_shipping_threshold}
              onChange={e =>
                setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })
              }
              className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
            />
            <p className="text-[10px] text-text-muted mt-1">Free delivery unlocks at this cart subtotal</p>
          </div>
        </div>
      </div>

      {/* 2. Business Information */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
          <Building className="w-4 h-4 text-brand" />
          <span>Business Identity & Contact Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-body mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={settings.business_name}
              onChange={e => setSettings({ ...settings, business_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-body mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-text-body mb-1">Store Address (Pickup Location) *</label>
            <input
              type="text"
              required
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-body mb-1">WhatsApp Business Number *</label>
            <input
              type="text"
              required
              value={settings.whatsapp_number}
              onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
              className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-body mb-1">Support Email *</label>
            <input
              type="email"
              required
              value={settings.support_email}
              onChange={e => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
