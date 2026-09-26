import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Heart, Sparkles, MessageCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-light text-brand">
          <Sparkles className="w-3.5 h-3.5" /> Page Not Found
        </span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-main">
          Oops, We Couldn&apos;t Find That Page
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-md mx-auto">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let&apos;s guide you back to comfort.
        </p>
      </div>

      {/* Suggested Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-pill text-sm font-semibold hover:bg-brand-hover transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-surface text-brand border border-brand/20 px-6 py-3 rounded-pill text-sm font-semibold hover:bg-brand-light transition shadow-subtle"
        >
          <Search className="w-4 h-4" /> Explore Shop
        </Link>
      </div>

      {/* Popular Categories */}
      <div className="pt-8 border-t border-border space-y-4">
        <h3 className="font-display font-semibold text-sm text-text-main uppercase tracking-wider">
          Popular Categories
        </h3>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <Link
            href="/categories/feminine-care"
            className="px-4 py-2 rounded-full bg-surface border border-border text-text-body hover:border-brand hover:text-brand transition"
          >
            🌸 Feminine Care
          </Link>
          <Link
            href="/collections/bloomie-care"
            className="px-4 py-2 rounded-full bg-surface border border-border text-text-body hover:border-brand hover:text-brand transition"
          >
            📦 Bloomie Care Kits
          </Link>
          <Link
            href="/collections/under-10k-finds"
            className="px-4 py-2 rounded-full bg-surface border border-border text-text-body hover:border-brand hover:text-brand transition"
          >
            ✨ Under ₦10k Finds
          </Link>
          <Link
            href="/categories/wellness-body-care"
            className="px-4 py-2 rounded-full bg-surface border border-border text-text-body hover:border-brand hover:text-brand transition"
          >
            🌿 Wellness & Body Care
          </Link>
        </div>
      </div>

      {/* Need Help CTA */}
      <div className="bg-brand-light/50 border border-brand/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-text-main">Looking for a specific kit?</h4>
            <p className="text-xs text-text-muted">Chat with our customer concierge on WhatsApp for instant assistance.</p>
          </div>
        </div>
        <a
          href="https://wa.me/2348103641002"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-pill hover:bg-emerald-700 transition whitespace-nowrap"
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
