import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
}

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'cat-18145': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778404649/rcy2hfmeanadciu5ecws.jpg',
  'wellness-body-care': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1778404649/rcy2hfmeanadciu5ecws.jpg',

  'cat-18130': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789338151/kb1mlsxmyh35qiewtrro.jpg',
  'feminine-care': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789338151/kb1mlsxmyh35qiewtrro.jpg',

  'cat-18133': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg',
  'everyday-essentials': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg',

  'cat-18131': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392317/mo2xpti2h9b6qvsuv0u8.jpg',
  'comfort-relaxation': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789392317/mo2xpti2h9b6qvsuv0u8.jpg',

  'cat-18132': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777922535/wcdwg9lj9vukg7v618xt.jpg',
  'beauty-self-care': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1777922535/wcdwg9lj9vukg7v618xt.jpg',

  'cat-bloomie-care': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
  'bloomie-care': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',

  'cat-under-10k': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789398339/jybtyu4rrytv7mgoksvl.jpg',
  'under-10k-finds': 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789398339/jybtyu4rrytv7mgoksvl.jpg',
};

const OLD_PLACEHOLDER = 'sbeli1b41qdlryawrrzn.jpg';

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
    <section className="py-12 sm:py-16 w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5 sm:gap-4">
        {displayCategories.map((cat, index) => {
          const href = (cat as any).href || `/categories/${cat.slug}`;
          const isGeneric = !cat.image_url || cat.image_url.includes(OLD_PLACEHOLDER);
          const resolvedImage: string = isGeneric
            ? (CATEGORY_IMAGE_MAP[cat.id] || CATEGORY_IMAGE_MAP[cat.slug] || '/images/logo.jpg')
            : (cat.image_url || '/images/logo.jpg');

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
                  src={resolvedImage}
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
