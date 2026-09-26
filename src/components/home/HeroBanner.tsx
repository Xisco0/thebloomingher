import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { HeroSlide } from '@/types';

interface HeroBannerProps {
  slide?: HeroSlide;
}

export function HeroBanner({ slide }: HeroBannerProps) {
  const currentSlide: HeroSlide = slide || {
    id: 'hero-default',
    badge: 'FEMININE CARE • WELLNESS • EVERYDAY ESSENTIALS',
    title: 'Thoughtfully selected essentials for your',
    highlightedTitle: 'care, comfort & lifestyle.',
    subtitle: 'Quality products for a healthier, happier you. Delivered across Lagos and Nigeria.',
    primaryCtaText: 'Shop Best Sellers',
    primaryCtaLink: '/products',
    secondaryCtaText: 'Explore Bloomie Care',
    secondaryCtaLink: '/collections/bloomie-care',
    imageUrl: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg',
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-light/70 via-background to-background pt-8 pb-12 sm:pb-16 lg:pt-12 lg:pb-20">
      <div className="w-[85%] max-w-[85%] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Content Area (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10" data-aos="fade-up">
            {/* Category Tagline Badge */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-brand-light border border-brand/20 text-brand text-xs font-semibold tracking-wider uppercase">
              <span>{currentSlide.badge}</span>
            </div>

            {/* Main Display Headline */}
            <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-5xl text-text-main leading-[1.15] tracking-tight">
              {currentSlide.title}{' '}
              <span className="text-brand italic font-normal block sm:inline">
                {currentSlide.highlightedTitle}
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-text-body/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {currentSlide.subtitle}
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                href={currentSlide.primaryCtaLink}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-full font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <span>{currentSlide.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {currentSlide.secondaryCtaText && (
                <Link
                  href={currentSlide.secondaryCtaLink || '/products'}
                  className="w-full sm:w-auto px-6 py-3.5 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-full font-medium text-sm sm:text-base transition-colors"
                >
                  {currentSlide.secondaryCtaText}
                </Link>
              )}
            </div>
          </div>

          {/* Right Image Composition (5 Cols) */}
          <div className="lg:col-span-5 relative" data-aos="fade-left" data-aos-delay="150">
            <div className="relative mx-auto max-w-md lg:max-w-none aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src={currentSlide.imageUrl}
                alt="TheBloomingHer Care & Wellness"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Trust Badge */}
            <div 
              className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-left-6 bg-surface/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-elevated border border-border flex items-center gap-3 max-w-[200px] sm:max-w-[220px]"
              data-aos="zoom-in"
              data-aos-delay="300"
            >
              <div className="w-9 h-9 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0 font-bold text-sm">
                🌸
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-text-main">Bloomie Period Care</p>
                <p className="text-[10px] text-text-muted">Curated cycle boxes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
