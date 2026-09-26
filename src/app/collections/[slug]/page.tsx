import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { catalogService } from '@/services';
import { ProductCard } from '@/components/product/ProductCard';

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  if (params.slug === 'bloomie-care') {
    return {
      title: 'Bloomie Care Period Packages | TheBloomingHer Nigeria',
      description: 'Curated menstrual care boxes, heating belts, organic pads, and cycle comfort essentials.',
      alternates: {
        canonical: 'https://thebloomingher.com/collections/bloomie-care',
      },
      openGraph: {
        title: 'Bloomie Care Period Packages | TheBloomingHer Nigeria',
        description: 'Curated menstrual care boxes, heating belts, organic pads, and cycle comfort essentials.',
        url: 'https://thebloomingher.com/collections/bloomie-care',
      },
    };
  }
  if (params.slug === 'under-10k-finds') {
    return {
      title: 'Under ₦10,000 Essentials | TheBloomingHer Nigeria',
      description: 'Discover high-quality feminine wellness, body care, and everyday essentials under ₦10k.',
      alternates: {
        canonical: 'https://thebloomingher.com/collections/under-10k-finds',
      },
      openGraph: {
        title: 'Under ₦10,000 Essentials | TheBloomingHer Nigeria',
        description: 'Discover high-quality feminine wellness, body care, and everyday essentials under ₦10k.',
        url: 'https://thebloomingher.com/collections/under-10k-finds',
      },
    };
  }
  return {
    title: 'Curated Collection | TheBloomingHer Care & Wellness',
    alternates: {
      canonical: `https://thebloomingher.com/collections/${params.slug}`,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  let title = 'Curated Collection';
  let subtitle = 'Thoughtfully selected products for your lifestyle.';
  let isBloomie = false;
  let isUnder10k = false;

  if (params.slug === 'bloomie-care') {
    title = 'Bloomie Care Period Kits 🌸';
    subtitle = 'Comprehensive menstrual care boxes, heating belts, organic sanitary pads, and cycle comfort essentials.';
    isBloomie = true;
  } else if (params.slug === 'under-10k-finds') {
    title = 'Under ₦10,000 Finds ✨';
    subtitle = 'Accessible, high-value self-care, beauty tools, and daily essentials for your monthly routine.';
    isUnder10k = true;
  } else {
    notFound();
  }

  const productsRes = await catalogService.getProducts({
    categorySlug: isBloomie ? 'feminine-care' : undefined,
    isUnder10k: isUnder10k,
    pageSize: 50,
  });

  return (
    <div className="w-[85%] max-w-[85%] mx-auto py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href="/products" className="hover:text-brand transition-colors">
          Collections
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-text-main font-semibold">{title}</span>
      </nav>

      {/* Collection Header Banner */}
      <div className={`rounded-3xl p-6 sm:p-10 border mb-10 text-center sm:text-left ${
        isBloomie ? 'bg-gradient-to-r from-brand-light to-[#FCE7F3] border-brand/20' : 'bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] border-emerald-200'
      }`}>
        <span className="text-xs uppercase tracking-wider font-bold block mb-1 text-brand">
          Featured Collection
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-main">
          {title}
        </h1>
        <p className="text-sm text-text-body/80 mt-2 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {productsRes.data.map(prod => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </div>
  );
}
