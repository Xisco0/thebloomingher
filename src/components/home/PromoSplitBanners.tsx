import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { SplitPromoBanner } from '@/types';

interface PromoSplitBannersProps {
  banners?: {
    left: SplitPromoBanner;
    right: SplitPromoBanner;
  };
}

export function PromoSplitBanners({ banners }: PromoSplitBannersProps) {
  const leftBanner: SplitPromoBanner = banners?.left || {
    title: 'Period Care Made Easier',
    subtitle: 'Stay comfortable, confident and prepared — every day of the month with curated boxes.',
    ctaText: 'Shop Period Care',
    ctaLink: '/categories/feminine-care',
    imageUrl: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
    theme: 'plum',
  };

  const rightBanner: SplitPromoBanner = banners?.right || {
    title: 'Wellness Starts Here',
    subtitle: 'Feel good. Look good. Live better with our daily botanical and body wellness essentials.',
    ctaText: 'Shop Wellness',
    ctaLink: '/categories/wellness-body-care',
    imageUrl: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg',
    theme: 'wellness',
  };

  return (
    <section className="py-6 w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Banner: Period Care (Plum / Rose theme) */}
        <div 
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FDF2F8] to-[#FCE7F3] p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-brand/10 shadow-subtle group"
          data-aos="fade-up"
        >
          <div className="space-y-3 sm:max-w-[55%] text-left z-10 w-full min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand px-2.5 py-1 bg-white/80 rounded-full inline-block">
              Signature Cycle Care
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-text-main leading-snug">
              {leftBanner.title}
            </h3>
            <p className="text-xs sm:text-sm text-text-body/80 leading-relaxed">
              {leftBanner.subtitle}
            </p>
            <Link
              href={leftBanner.ctaLink}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-brand hover:bg-brand-hover px-5 py-2.5 rounded-full shadow-sm transition-all group-hover:shadow-md"
            >
              <span>{leftBanner.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border-2 border-white">
            <Image
              src={leftBanner.imageUrl}
              alt={leftBanner.title}
              fill
              sizes="(max-width: 640px) 160px, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Right Banner: Wellness (Warm Green / Botanical theme) */}
        <div 
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-100 shadow-subtle group"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="space-y-3 sm:max-w-[55%] text-left z-10 w-full min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 px-2.5 py-1 bg-white/80 rounded-full inline-block">
              Body & Herbal Care
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-text-main leading-snug">
              {rightBanner.title}
            </h3>
            <p className="text-xs sm:text-sm text-text-body/80 leading-relaxed">
              {rightBanner.subtitle}
            </p>
            <Link
              href={rightBanner.ctaLink}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 rounded-full shadow-sm transition-all group-hover:shadow-md"
            >
              <span>{rightBanner.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border-2 border-white">
            <Image
              src={rightBanner.imageUrl}
              alt={rightBanner.title}
              fill
              sizes="(max-width: 640px) 160px, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
