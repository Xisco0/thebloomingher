import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface EverydayEssentialsSectionProps {
  products: Product[];
}

export function EverydayEssentialsSection({ products }: EverydayEssentialsSectionProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-surface-muted/30 border-y border-border/60">
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8" data-aos="fade-up">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-light text-brand border border-brand/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              General Lifestyle & Daily Utility
            </span>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
              Everyday Essentials
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-xl">
              Useful, practical products for your work, home, and daily routine. Coffee mugs, water bottles, wristwatches, tote bags, and accessories.
            </p>
          </div>

          <Link
            href="/everyday-essentials"
            className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover flex items-center gap-1 group whitespace-nowrap self-start sm:self-auto"
          >
            <span>Explore All Everyday Essentials</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
