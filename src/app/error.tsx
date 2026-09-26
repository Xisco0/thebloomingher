'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized client error
    console.error('[Storefront Error]:', error.message);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
      <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
          Something went wrong
        </h1>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          We encountered an unexpected issue while loading this page. Please try refreshing or return to the shop.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-pill text-sm font-semibold hover:bg-brand-hover transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-surface text-text-main border border-border px-5 py-2.5 rounded-pill text-sm font-semibold hover:bg-surface-muted transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    </div>
  );
}
