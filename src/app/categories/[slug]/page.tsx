import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { catalogService } from '@/services';
import { ShopCatalogClient } from '@/components/shop/ShopCatalogClient';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await catalogService.getCategoryBySlug(params.slug);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: category.seo_title || `${category.name} | TheBloomingHer Care & Wellness Nigeria`,
    description:
      category.seo_description ||
      category.description ||
      `Shop authentic ${category.name} products in Lagos and across Nigeria. Fast delivery and free shipping over ₦40,000.`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | TheBloomingHer Care & Wellness`,
      description: category.description || `Discover authentic ${category.name} items.`,
      url: `/categories/${category.slug}`,
      images: category.image_url
        ? [{ url: category.image_url, width: 1200, height: 630, alt: category.name }]
        : [],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [category, allCategories, allProductsRes] = await Promise.all([
    catalogService.getCategoryBySlug(params.slug),
    catalogService.getCategories(),
    catalogService.getProducts({ pageSize: 100 }),
  ]);

  if (!category) notFound();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thebloomingher.com' },
    { name: 'Shop', url: 'https://thebloomingher.com/shop' },
    { name: category.name, url: `https://thebloomingher.com/categories/${category.slug}` },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://thebloomingher.com/categories/${category.slug}`,
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

      <div className="w-[85%] max-w-[85%] mx-auto pt-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-2 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link href="/shop" className="hover:text-brand transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-text-main font-semibold">{category.name}</span>
        </nav>
      </div>

      <ShopCatalogClient
        initialProducts={allProductsRes.data}
        categories={allCategories}
        initialCategorySlug={category.slug}
        pageTitle={category.name}
        pageDescription={
          category.description ||
          `Browse all products in ${category.name}, curated specifically for your everyday comfort and health.`
        }
      />
    </>
  );
}
