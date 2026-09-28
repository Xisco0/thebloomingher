import React from 'react';
import type { Metadata } from 'next';
import { catalogService } from '@/services';
import { ShopCatalogClient } from '@/components/shop/ShopCatalogClient';

export const metadata: Metadata = {
  title: 'Products Catalogue | TheBloomingHer Care & Wellness',
  description:
    'Browse our complete catalogue of feminine care, period relief heating belts, herbal teas, and wellness products in Lagos, Nigeria.',
  alternates: {
    canonical: '/products',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsPage() {
  const [productsResult, categories] = await Promise.all([
    catalogService.getProducts({ pageSize: 100 }),
    catalogService.getCategories(),
  ]);

  return (
    <ShopCatalogClient
      initialProducts={productsResult.data}
      categories={categories}
      pageTitle="All Products"
      pageDescription="Explore verified feminine care essentials, pain relief items, and beauty care."
    />
  );
}
