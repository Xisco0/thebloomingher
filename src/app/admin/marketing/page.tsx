'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tv,
  Flag,
  Calendar,
  Megaphone,
  Ticket,
  ImageIcon,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { MarketingBanner, MarketingCampaign, MarketingEvent, MarketingAnnouncement } from '@/types/marketing-cms.types';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function MarketingDashboardPage() {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [announcements, setAnnouncements] = useState<MarketingAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, eRes, aRes] = await Promise.all([
        fetch('/api/admin/marketing/banners').then(r => r.json()),
        fetch('/api/admin/marketing/campaigns').then(r => r.json()),
        fetch('/api/admin/marketing/events').then(r => r.json()),
        fetch('/api/admin/marketing/announcements').then(r => r.json()),
      ]);

      if (bRes.success) setBanners(bRes.banners || []);
      if (cRes.success) setCampaigns(cRes.campaigns || []);
      if (eRes.success) setEvents(eRes.events || []);
      if (aRes.success) setAnnouncements(aRes.announcements || []);
    } catch (err) {
      console.error('Failed to load marketing dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeBanners = banners.filter(b => b.status === 'active');
  const scheduledBanners = banners.filter(b => b.status === 'scheduled');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');

  const statCards = [
    {
      label: 'Active Hero Banners',
      count: activeBanners.length,
      sub: `${scheduledBanners.length} scheduled`,
      icon: Tv,
      href: '/admin/marketing/banners',
      color: 'text-brand bg-brand-light',
    },
    {
      label: 'Live Campaigns',
      count: activeCampaigns.length,
      sub: `${campaigns.length} total marketing hubs`,
      icon: Flag,
      href: '/admin/marketing/campaigns',
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Upcoming Events',
      count: upcomingEvents.length,
      sub: 'Workshops & community',
      icon: Calendar,
      href: '/admin/marketing/events',
      color: 'text-purple-700 bg-purple-50',
    },
    {
      label: 'Store Announcements',
      count: announcements.filter(a => a.status === 'active').length,
      sub: 'Top bar & banner notices',
      icon: Megaphone,
      href: '/admin/marketing/announcements',
      color: 'text-amber-700 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <MarketingSubNav />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Marketing & Content
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Marketing
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create banners, promotional discounts, community events, and announcements for your store.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Store</span>
          </Link>

          <Link
            href="/admin/marketing/banners?action=create"
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              href={c.href}
              className="bg-surface rounded-2xl p-5 border border-border/80 shadow-subtle hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-bold font-display text-text-main block">
                  {loading ? '...' : c.count}
                </span>
                <span className="text-xs font-semibold text-text-main block mt-1">{c.label}</span>
                <span className="text-[11px] text-text-muted">{c.sub}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Launch & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Hero Banners Carousel Status */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-brand" />
              <h3 className="font-display font-bold text-base text-text-main">
                Active Homepage Hero Carousel
              </h3>
            </div>
            <Link
              href="/admin/marketing/banners"
              className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
            >
              <span>Manage Banners</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-text-muted">
            These slides are currently rotating on the storefront homepage in their priority order.
          </p>

          <div className="space-y-3">
            {loading ? (
              <div className="py-10 text-center text-xs text-text-muted">Loading live banners...</div>
            ) : activeBanners.length === 0 ? (
              <div className="p-6 text-center bg-surface-muted/50 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-text-main">No active hero banners</p>
                <p className="text-[11px] text-text-muted">Storefront will display the default branded fallback.</p>
              </div>
            ) : (
              activeBanners.map((b, idx) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-muted/40 border border-border/60 hover:border-brand/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-text-main">{b.internal_name}</h4>
                      <p className="text-[11px] text-text-muted">
                        Type: <span className="capitalize text-text-main">{b.banner_type.replace('_', ' ')}</span> • CTA: {b.primary_cta.text} → {b.primary_cta.url}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    Live
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Marketing Navigation Hub */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle space-y-4">
          <h3 className="font-display font-bold text-base text-text-main">Marketing Tooling</h3>
          <p className="text-xs text-text-muted">Direct shortcuts to CMS management sections.</p>

          <div className="space-y-2">
            {[
              { label: 'Banners & Hero Creative', href: '/admin/marketing/banners', icon: Tv, desc: 'Manage rotating slides & promo strips' },
              { label: 'Campaigns Hub', href: '/admin/marketing/campaigns', icon: Flag, desc: 'Black Friday & seasonal festivals' },
              { label: 'Community Events', href: '/admin/marketing/events', icon: Calendar, desc: 'Wellness day workshops & RSVP' },
              { label: 'Store Announcements', href: '/admin/marketing/announcements', icon: Megaphone, desc: 'Top notice bar & popups' },
              { label: 'Discounts & Coupons', href: '/admin/marketing/coupons', icon: Ticket, desc: 'Promo codes & minimum order rules' },
              { label: 'Media Library', href: '/admin/marketing/media', icon: ImageIcon, desc: 'Centralized gallery & asset reuse' },
            ].map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-muted transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-light/60 text-brand flex items-center justify-center">
                      <ToolIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-main group-hover:text-brand transition-colors">
                        {tool.label}
                      </h4>
                      <p className="text-[10px] text-text-muted">{tool.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
