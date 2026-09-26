import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Search } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto text-brand">
        <ShoppingBag className="w-8 h-8" />
      </div>

      <h1 className="font-display font-bold text-3xl text-text-main">
        Product Not Found
      </h1>

      <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
        The item you are looking for might have been restocked under a new name, moved to a different category, or is temporarily unavailable.
      </p>

      <div className="flex flex-wrap justify-center gap-3 pt-4">
        <Link
          href="/shop"
          className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-sm shadow-sm transition-colors flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse All Products</span>
        </Link>

        <Link
          href="/categories/period-wellness"
          className="px-6 py-3 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-full font-semibold text-sm transition-colors"
        >
          Period & Menstrual Care
        </Link>

        <Link
          href="/categories/body-personal-care"
          className="px-6 py-3 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-full font-semibold text-sm transition-colors"
        >
          Body & Intimate Care
        </Link>
      </div>
    </div>
  );
}
