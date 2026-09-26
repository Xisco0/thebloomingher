import React from 'react';
import type { Metadata } from 'next';
import { catalogService } from '@/services';
import { ShopCatalogClient } from '@/components/shop/ShopCatalogClient';

export const metadata: Metadata = {
  title: 'Shop All Products | TheBloomingHer Care & Wellness Nigeria',
  description:
    'Discover our full collection of menstrual pain relief belts, feminine hygiene washes, organic pads, wellness supplements, and self-care essentials in Lagos, Nigeria.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop All Products | TheBloomingHer Care & Wellness',
    description:
      'Premium feminine care and wellness products. Free Lagos delivery over ₦40,000. Order online or via WhatsApp.',
    url: '/shop',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'TheBloomingHer Care & Wellness Shop',
      },
    ],
  },
};

export default async function ShopPage() {
  const [productsResult, categories] = await Promise.all([
    catalogService.getProducts({ pageSize: 100 }),
    catalogService.getCategories(),
  ]);

  return (
    <ShopCatalogClient
      initialProducts={productsResult.data}
      categories={categories}
      pageTitle="Shop All Care & Wellness"
      pageDescription="Browse all 67+ curated products designed for menstrual comfort, intimate hygiene, and everyday personal wellness."
    />
  );
}
