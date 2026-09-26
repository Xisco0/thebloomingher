import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface Under10kSectionProps {
  products: Product[];
}

export function Under10kSection({ products }: Under10kSectionProps) {
  return (
    <section className="py-12 sm:py-16 bg-brand-light/30 border-y border-border/60">
      <div className="w-[85%] max-w-[85%] mx-auto">
        <div className="flex justify-between items-end mb-8" data-aos="fade-up">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Budget-Friendly Care</span>
            </span>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
              Under ₦10,000 Essentials
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Everyday comfort and wellness items that fit your monthly budget.
            </p>
          </div>
          <Link
            href="/collections/under-10k-finds"
            className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover flex items-center gap-1 group"
          >
            <span>See All ({products.length > 0 ? '38+' : '0'})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {products.slice(0, 4).map((product, index) => (
            <div key={product.id} data-aos="fade-up" data-aos-delay={index * 80}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
