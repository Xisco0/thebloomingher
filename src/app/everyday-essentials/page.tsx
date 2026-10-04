import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Sparkles, Coffee, Watch, ShoppingBag, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { catalogService } from '@/services';
import { ShopCatalogClient } from '@/components/shop/ShopCatalogClient';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Everyday Essentials Products in Lagos & Nigeria | TheBloomingHer',
  description:
    'Shop authentic everyday lifestyle essentials in Lagos and across Nigeria. High quality stainless coffee mugs, water bottles, wristwatches, tote bags, phone accessories & more.',
  alternates: {
    canonical: '/everyday-essentials',
  },
  openGraph: {
    title: 'Everyday Essentials Products in Lagos & Nigeria | TheBloomingHer',
    description:
      'Useful general lifestyle and everyday products delivered fast across Lagos and Nigeria. Coffee mugs, water bottles, watches, bags, and power banks.',
    url: '/everyday-essentials',
    images: [
      {
        url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg',
        width: 1200,
        height: 630,
        alt: 'Everyday Essentials - TheBloomingHer Care & Wellness',
      },
    ],
  },
};

export default async function EverydayEssentialsPage() {
  const [allCategories, allProductsRes] = await Promise.all([
    catalogService.getCategories(),
    catalogService.getProducts({ categorySlug: 'everyday-essentials', pageSize: 100 }),
  ]);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thebloomingher.com' },
    { name: 'Shop', url: 'https://www.thebloomingher.com/shop' },
    { name: 'Everyday Essentials', url: 'https://www.thebloomingher.com/everyday-essentials' },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Everyday Essentials',
    description:
      'Useful general lifestyle products including coffee mugs, water bottles, wristwatches, sunglasses, bags, phone accessories, power banks, stationery, and home items.',
    url: 'https://www.thebloomingher.com/everyday-essentials',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto pt-6 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link href="/shop" className="hover:text-brand transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-text-main font-semibold">Everyday Essentials</span>
        </nav>

        {/* Hero Category Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-pink-500/10 via-rose-100/50 to-surface-muted border border-brand/20 p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Lifestyle & Everyday Products
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-4xl text-text-main">
              Everyday Essentials
            </h1>
            <p className="text-xs sm:text-sm text-text-body leading-relaxed">
              Discover useful, high-quality general lifestyle products for work, home, travel, and daily convenience. From stainless coffee mugs and water bottles to wristwatches, tote bags, and tech accessories — delivered fast in Lagos & across Nigeria.
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 pt-2 text-[11px] font-semibold text-text-main flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-brand" /> Fast Delivery in Lagos
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" /> 100% Quality Guaranteed
              </span>
            </div>
          </div>

          <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-md border-2 border-white flex-shrink-0">
            <Image
              src="https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg"
              alt="Everyday Essentials - TheBloomingHer"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Catalog Display Component */}
      <ShopCatalogClient
        initialProducts={allProductsRes.data}
        categories={allCategories}
        initialCategorySlug="everyday-essentials"
        pageTitle=""
        pageDescription=""
      />
    </>
  );
}
