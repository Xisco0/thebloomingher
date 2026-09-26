'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  Edit,
  Tag,
  ShoppingBag,
} from 'lucide-react';

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  badge: string;
  targetCount: number;
}

export default function AdminCollectionsPage() {
  const [collections] = useState<CollectionItem[]>([
    {
      id: 'col-1',
      name: 'Period Essentials',
      slug: 'period-essentials',
      description: 'Must-have thermal belts, leak-proof cups, breathable organic liners, and soothing teas.',
      imageUrl: '/images/logo.jpg',
      badge: 'High Conversion',
      targetCount: 12,
    },
    {
      id: 'col-2',
      name: 'Wellness Under ₦10,000',
      slug: 'under-10k',
      description: 'Budget-friendly, high-utility feminine care essentials for everyday peace of mind in Nigeria.',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      badge: 'Price Sensitive',
      targetCount: 8,
    },
    {
      id: 'col-3',
      name: 'On-The-Go & Travel Essentials',
      slug: 'travel-essentials',
      description: 'Portable wipes, toilet seat covers, disposable towels, and compact pocket tissues.',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
      badge: 'High Frequency',
      targetCount: 7,
    },
    {
      id: 'col-4',
      name: 'Best Sellers',
      slug: 'best-sellers',
      description: 'Our highest-rated customer favorites backed by hundreds of verified reviews.',
      imageUrl: '/images/logo.jpg',
      badge: 'Top Rated',
      targetCount: 10,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Curated Collections
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Marketing-driven thematic collections designed to boost average order value (AOV).
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {collections.map(col => (
          <div
            key={col.id}
            className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-brand/40 transition-all group"
          >
            <div>
              <div className="relative h-44 w-full bg-surface-muted">
                <Image
                  src={col.imageUrl}
                  alt={col.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand text-white shadow-xs">
                    {col.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-display font-bold text-lg drop-shadow-sm">{col.name}</h3>
                  <span className="text-xs text-white/80 font-mono">/collections/{col.slug}</span>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <p className="text-xs text-text-body leading-relaxed">{col.description}</p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between border-t border-border/50 mt-2 pt-4">
              <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-brand" />
                <span>{col.targetCount} Products Included</span>
              </span>

              <Link
                href={`/collections/${col.slug}`}
                target="_blank"
                className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>View Storefront Collection</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
