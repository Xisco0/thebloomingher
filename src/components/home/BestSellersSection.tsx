import React from 'react';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface BestSellersSectionProps {
  products: Product[];
}

export function BestSellersSection({ products }: BestSellersSectionProps) {
  const displayProducts = products.slice(0, 5);

  return (
    <section className="py-12 sm:py-16 w-[85%] max-w-[85%] mx-auto">
      <div className="flex justify-between items-end mb-8" data-aos="fade-up">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold flex items-center gap-1.5 mb-1.5">
            <Flame className="w-4 h-4 fill-brand text-brand" />
            <span>Customer Favorites</span>
          </span>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
            Best Sellers
          </h2>
        </div>
        <Link
          href="/products?filter=bestsellers"
          className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover flex items-center gap-1.5 group"
        >
          <span>View All Best Sellers</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 5-Column spacious grid for wider product cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {displayProducts.map((product, index) => (
          <div key={product.id} data-aos="fade-up" data-aos-delay={index * 80}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
