import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  // Add special visual cards for "Bloomie Care" and "Under 10k Finds"
  const displayCategories = [
    ...categories,
    {
      id: 'cat-bloomie-care',
      name: 'Bloomie Care',
      slug: 'bloomie-care',
      image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
      isSpecialCollection: true,
      href: '/collections/bloomie-care',
    },
    {
      id: 'cat-under-10k',
      name: 'Under 10k Finds',
      slug: 'under-10k-finds',
      image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789398339/jybtyu4rrytv7mgoksvl.jpg',
      isSpecialCollection: true,
      href: '/collections/under-10k-finds',
    },
  ];

  return (
    <section className="py-12 sm:py-16 w-[85%] max-w-[85%] mx-auto">
      <div className="flex justify-between items-end mb-8" data-aos="fade-up">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            Curated Collections
          </span>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover flex items-center gap-1 group"
        >
          <span>View All Products</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {displayCategories.map((cat, index) => {
          const href = (cat as any).href || `/categories/${cat.slug}`;
          return (
            <Link
              key={cat.id}
              href={href}
              data-aos="fade-up"
              data-aos-delay={index * 60}
              className="group relative flex flex-col items-center bg-surface p-3.5 sm:p-4 rounded-2xl border border-border/80 hover:border-brand/40 shadow-subtle hover:shadow-card-hover transition-all text-center"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-light/40 mb-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={cat.image_url || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg'}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100px, 120px"
                  className="object-cover"
                />
              </div>

              <h3 className="font-display font-semibold text-xs sm:text-sm text-text-main group-hover:text-brand transition-colors line-clamp-1">
                {cat.name}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
