import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Sparkles } from 'lucide-react';
import { catalogService } from '@/services';
import { ShopCatalogClient } from '@/components/shop/ShopCatalogClient';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    { name: 'Home', url: 'https://www.thebloomingher.com' },
    { name: 'Shop', url: 'https://www.thebloomingher.com/shop' },
    { name: category.name, url: `https://www.thebloomingher.com/categories/${category.slug}` },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `https://www.thebloomingher.com/categories/${category.slug}`,
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
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto whitespace-nowrap">
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

        {/* Hero Category Banner Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-light/90 via-pink-50/80 to-surface-muted border border-brand/20 p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Category Collection
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-4xl text-text-main">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-text-body leading-relaxed">
              {category.description ||
                `Explore authentic ${category.name} products curated for your daily comfort, health, and wellbeing.`}
            </p>
          </div>

          {category.image_url && (
            <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-md border-2 border-white flex-shrink-0">
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <ShopCatalogClient
        initialProducts={allProductsRes.data}
        categories={allCategories}
        initialCategorySlug={category.slug}
        pageTitle=""
        pageDescription=""
      />
    </>
  );
}
