'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Monitor, Tablet, Smartphone, Eye, ArrowRight } from 'lucide-react';
import { MarketingBanner, PreviewDevice } from '@/types/marketing-cms.types';

interface BannerPreviewModalProps {
  banner: MarketingBanner | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BannerPreviewModal({ banner, isOpen, onClose }: BannerPreviewModalProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');

  if (!isOpen || !banner) return null;

  const currentImage =
    device === 'mobile' && banner.mobile_image_url
      ? banner.mobile_image_url
      : device === 'tablet' && banner.tablet_image_url
      ? banner.tablet_image_url
      : banner.desktop_image_url;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header & Device Switcher */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-muted/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Real-Time Storefront Simulator
            </span>
            <h3 className="font-display font-bold text-base sm:text-lg text-text-main truncate max-w-md">
              Preview: {banner.internal_name}
            </h3>
          </div>

          {/* Device Controls */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border shadow-xs">
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                device === 'desktop'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop (1200px)</span>
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                device === 'tablet'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet (768px)</span>
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                device === 'mobile'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (375px)</span>
            </button>
            <button
              onClick={() => setDevice('visitor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                device === 'visitor'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visitor Mode</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Frame Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-900/5 flex items-center justify-center">
          <div
            className={`transition-all duration-300 bg-white rounded-2xl shadow-xl overflow-hidden border border-border/80 ${
              device === 'desktop'
                ? 'w-full max-w-5xl'
                : device === 'tablet'
                ? 'w-[768px] max-w-full'
                : device === 'mobile'
                ? 'w-[375px] max-w-full'
                : 'w-full'
            }`}
          >
            {/* Mock Browser Header for Visitor Mode */}
            {device === 'visitor' && (
              <div className="bg-neutral-100 border-b border-border/80 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-white rounded-md px-3 py-0.5 text-[11px] text-text-muted text-center truncate border border-border/60">
                  https://thebloomingher.com
                </div>
              </div>
            )}

            {/* Banner Rendering Inside Frame */}
            <div className="relative bg-gradient-to-b from-brand-light/70 via-background to-background p-6 sm:p-10 lg:p-12">
              <div className={`${device === 'mobile' ? 'flex flex-col gap-6 text-center' : 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'}`}>
                {/* Text Content */}
                <div className={`${device === 'mobile' ? 'space-y-4' : 'lg:col-span-7 space-y-5 text-left'}`}>
                  {banner.badge_text && (
                    <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-brand-light border border-brand/20 text-brand text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                      <span>{banner.badge_text}</span>
                    </div>
                  )}

                  <h2 className="font-display font-bold text-2xl sm:text-4xl text-text-main leading-tight tracking-tight">
                    {banner.title}{' '}
                    {banner.highlighted_title && (
                      <span className="text-brand italic font-normal block sm:inline">
                        {banner.highlighted_title}
                      </span>
                    )}
                  </h2>

                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm text-text-body/90 leading-relaxed font-normal max-w-lg">
                      {banner.subtitle}
                    </p>
                  )}

                  {/* CTA Buttons */}
                  <div className={`flex items-center gap-3 pt-2 ${device === 'mobile' ? 'flex-col justify-center' : 'flex-row justify-start'}`}>
                    {banner.primary_cta?.text && (
                      <div className="w-full sm:w-auto px-6 py-3 bg-brand text-white rounded-full font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md">
                        <span>{banner.primary_cta.text}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {banner.secondary_cta?.text && (
                      <div className="w-full sm:w-auto px-5 py-3 bg-surface text-brand border border-brand/20 rounded-full font-medium text-xs sm:text-sm">
                        {banner.secondary_cta.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Creative Image */}
                <div className={`${device === 'mobile' ? 'w-full' : 'lg:col-span-5'} relative`}>
                  <div className="relative mx-auto aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shadow-xl border-2 border-white">
                    <Image
                      src={currentImage}
                      alt={banner.alt_text || 'Banner preview'}
                      fill
                      sizes="500px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-border bg-surface-muted/30 text-center text-[11px] text-text-muted">
          Active creative resolution: <span className="font-semibold text-text-main">{device === 'mobile' ? 'Dedicated Mobile Asset (4:5 / Square)' : 'Desktop High-Res Asset (16:9 / 4:3)'}</span> • Status: <span className="font-semibold uppercase text-brand">{banner.status}</span>
        </div>
      </div>
    </div>
  );
}
