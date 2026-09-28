'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingBanner } from '@/types/marketing-cms.types';

interface HeroCarouselProps {
  banners?: MarketingBanner[];
}

// Permanent System Fallback Hero Banner — Exists independently from CMS content
const SYSTEM_DEFAULT_BANNER: MarketingBanner = {
  id: 'system-permanent-fallback-hero',
  internal_name: 'The BloomingHer Brand Fallback Hero',
  badge_text: 'BEST SELLER • FAST ACTING DRUG-FREE COMFORT',
  title: 'Soothe Severe Period Cramp Pain in',
  highlighted_title: 'Under 10 Minutes.',
  subtitle: 'Doctor-tested rechargeable menstrual heating belt with soothing vibration and targeted thermal warmth. Same-day Lagos dispatch!',
  banner_type: 'promotion',
  placement: 'homepage_hero',
  primary_cta: {
    text: 'Order Cramp Relief Belt',
    destinationType: 'product',
    url: '/products/electric-heating-pad-vibration-cramp-relief-belt',
  },
  secondary_cta: {
    text: 'Explore All Essentials',
    destinationType: 'custom_page',
    url: '/products',
  },
  desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg',
  mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789398339/jybtyu4rrytv7mgoksvl.jpg',
  alt_text: 'The BloomingHer Care & Wellness — Electric Heating Pad Cramp Relief Belt',
  priority_order: 1,
  status: 'active',
  timezone: 'Africa/Lagos',
  created_at: '',
  updated_at: '',
};

export function HeroCarousel({ banners = [] }: HeroCarouselProps) {
  // Filter only active eligible banners; fallback to permanent system banner if empty
  const activeBanners = banners.filter(b => b && b.status === 'active');
  const slides: MarketingBanner[] = activeBanners.length > 0 ? activeBanners : [SYSTEM_DEFAULT_BANNER];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Clean 5-second automatic rotation when multiple eligible banners exist
  useEffect(() => {
    if (slides.length <= 1) return;

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    // Pause rotation temporarily on hover/interaction
    if (isHovered) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isHovered, nextSlide]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slides.length <= 1) return;
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, prevSlide, nextSlide]);

  const currentSlide = slides[currentIndex] || SYSTEM_DEFAULT_BANNER;
  const isMultiSlide = slides.length > 1;

  return (
    <section
      className="group relative overflow-hidden bg-gradient-to-b from-brand-light/70 via-background to-background pt-8 pb-12 sm:pb-16 lg:pt-12 lg:pb-20 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-roledescription="carousel"
      aria-label="Promotional Hero Showcase"
    >
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[440px]">
          {/* Left Content Area (7 Cols) */}
          <div
            key={`content-${currentSlide.id}-${currentIndex}`}
            className="lg:col-span-7 space-y-6 text-center lg:text-left z-10 animate-in fade-in slide-in-from-left-2 duration-500"
          >
            {/* Tagline Badge */}
            {currentSlide.badge_text && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-light border border-brand/20 text-brand text-xs font-semibold tracking-wider uppercase shadow-xs">
                <span>{currentSlide.badge_text.replace(/^[✨🌟⭐*•\s]+/, '')}</span>
              </div>
            )}

            {/* Display Headline */}
            <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-5xl text-text-main leading-[1.15] tracking-tight">
              {currentSlide.title}{' '}
              {currentSlide.highlighted_title && (
                <span className="text-brand italic font-normal block sm:inline">
                  {currentSlide.highlighted_title}
                </span>
              )}
            </h1>

            {/* Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-base sm:text-lg text-text-body/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {currentSlide.subtitle}
              </p>
            )}

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              {currentSlide.primary_cta?.text && (
                <Link
                  href={currentSlide.primary_cta.url || '/products'}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-full font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <span>{currentSlide.primary_cta.text}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {currentSlide.secondary_cta?.text && (
                <Link
                  href={currentSlide.secondary_cta.url || '/collections/bloomie-care'}
                  className="w-full sm:w-auto px-6 py-3.5 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-full font-medium text-sm sm:text-base transition-colors shadow-xs"
                >
                  {currentSlide.secondary_cta.text}
                </Link>
              )}
            </div>
          </div>

          {/* Right Image Composition (5 Cols) with Responsive Desktop vs Mobile Creative */}
          <div
            key={`image-${currentSlide.id}-${currentIndex}`}
            className="lg:col-span-5 relative animate-in fade-in zoom-in-95 duration-500"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-surface-muted">
              {/* Desktop Image */}
              <div className="hidden sm:block absolute inset-0">
                <Image
                  src={currentSlide.desktop_image_url}
                  alt={currentSlide.alt_text || 'The BloomingHer Care & Wellness'}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Dedicated Mobile Creative */}
              <div className="block sm:hidden absolute inset-0">
                <Image
                  src={currentSlide.mobile_image_url || currentSlide.desktop_image_url}
                  alt={currentSlide.alt_text || 'The BloomingHer Care & Wellness'}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>

              {/* Soft Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Trust Pill Badge */}
            <div className="absolute -bottom-3 left-2 sm:bottom-6 sm:-left-6 bg-surface/95 backdrop-blur-md p-2.5 sm:p-4 rounded-2xl shadow-elevated border border-border flex items-center gap-2.5 sm:gap-3 max-w-[190px] sm:max-w-[230px]">
              <div className="w-9 h-9 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0 font-bold text-sm">
                🌸
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-text-main">Bloomie Care</p>
                <p className="text-[10px] text-text-muted">Doctor-tested & trusted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Controls (Arrows & Indicators) */}
        {isMultiSlide && (
          <div className="mt-8 pt-4 flex items-center justify-between">
            {/* Previous Arrow */}
            <button
              onClick={prevSlide}
              className="p-2.5 rounded-full bg-surface/90 hover:bg-surface border border-border/80 text-text-muted hover:text-brand shadow-subtle hover:shadow-card transition-all active:scale-95 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Pagination Indicators */}
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-8 bg-brand'
                      : 'w-2 bg-brand/20 hover:bg-brand/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Arrow */}
            <button
              onClick={nextSlide}
              className="p-2.5 rounded-full bg-surface/90 hover:bg-surface border border-border/80 text-text-muted hover:text-brand shadow-subtle hover:shadow-card transition-all active:scale-95 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
