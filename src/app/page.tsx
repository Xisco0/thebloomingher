import React from 'react';
import { catalogService, cmsService } from '@/services';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { TrustBadges } from '@/components/home/TrustBadges';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { PromoSplitBanners } from '@/components/home/PromoSplitBanners';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { WhyTheBloomingHer } from '@/components/home/WhyTheBloomingHer';
import { Under10kSection } from '@/components/home/Under10kSection';
import { EventsSection } from '@/components/home/EventsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CommunitySection } from '@/components/home/CommunitySection';
import { RecommendedProductsGrid } from '@/components/recommendation/RecommendedProductsGrid';
import { RecentlyViewedSection } from '@/components/recommendation/RecentlyViewedSection';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TheBloomingHer Care & Wellness | Feminine Care & Wellness Products Nigeria',
  description:
    'Thoughtfully curated feminine care, menstrual comfort kits, wellness supplements, and everyday essentials in Lagos, Nigeria. Fast delivery & local pickup.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TheBloomingHer Care & Wellness | Feminine Care & Wellness Products Nigeria',
    description:
      'Thoughtfully curated feminine care, menstrual comfort kits, wellness supplements, and everyday essentials in Lagos, Nigeria.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'TheBloomingHer Care & Wellness',
      },
    ],
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [categories, bestSellers, under10k, cmsConfig, heroBanners, activeEvents] = await Promise.all([
    catalogService.getCategories(),
    catalogService.getBestSellers(5),
    catalogService.getUnder10k(8),
    cmsService.getHomepageConfig(),
    cmsService.getActiveBanners('homepage_hero'),
    cmsService.getActiveEvents(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Dynamic Hero Promotional Carousel (Marketing CMS Driven) */}
      <HeroCarousel banners={heroBanners} />

      {/* 2. Value & Trust Badges Strip */}
      <TrustBadges />

      {/* 3. Shop By Category Showcase */}
      <CategoryGrid categories={categories} />

      {/* 4. Promotional Feature Split Banners */}
      <PromoSplitBanners banners={cmsConfig.splitBanners} />

      {/* 5. Best Sellers Section */}
      <BestSellersSection products={bestSellers} />

      {/* 6. Community & Wellness Events Showcase */}
      <EventsSection events={activeEvents} />

      {/* 7. Why TheBloomingHer Brand Value Pillars */}
      <WhyTheBloomingHer />

      {/* 8. Under ₦10,000 Finds */}
      <Under10kSection products={under10k} />

      {/* 9. Social Proof & Verified Customer Reviews */}
      <TestimonialsSection testimonials={cmsConfig.testimonials} />

      {/* 10. Personalized Recommendations & Trending Discoveries */}
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-12">
        <RecommendedProductsGrid
          context="homepage"
          title="Recommended For You"
          subtitle="Tailored to your wellness interests and shopping activity in Nigeria."
          limit={4}
        />

        <div className="mt-8">
          <RecentlyViewedSection limit={4} />
        </div>
      </div>

      {/* 11. Newsletter & WhatsApp VIP Concierge */}
      <CommunitySection />
    </div>
  );
}
