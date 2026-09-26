'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Search, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { generateWhatsAppSupportLink } from '@/lib/utils/whatsapp';

export function MobileNav() {
  const pathname = usePathname();
  const { totalItemsCount, openCart } = useCart();
  const whatsappUrl = generateWhatsAppSupportLink();

  return (
    <>
      {/* Floating WhatsApp Contact Button (Positioned above bottom nav) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center group"
        aria-label="Chat with TheBloomingHer on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white text-transparent" />
        <span className="hidden md:group-hover:inline-block absolute right-full mr-3 bg-brand-dark text-white text-xs px-2.5 py-1 rounded-md whitespace-nowrap shadow-md">
          Chat on WhatsApp
        </span>
      </a>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-border shadow-elevated">
        <div className="grid grid-cols-4 h-16 items-center px-2">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              pathname === '/' ? 'text-brand font-semibold' : 'text-text-muted hover:text-brand'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>

          {/* 2. Shop Catalog */}
          <Link
            href="/shop"
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              pathname.startsWith('/shop') || pathname.startsWith('/products') || pathname.startsWith('/categories')
                ? 'text-brand font-semibold'
                : 'text-text-muted hover:text-brand'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px]">Shop</span>
          </Link>

          {/* 3. Search Trigger */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-search-modal'))}
            className="flex flex-col items-center justify-center gap-1 py-1 text-text-muted hover:text-brand transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Search</span>
          </button>

          {/* 4. Cart Trigger with Live Counter */}
          <button
            onClick={openCart}
            className="flex flex-col items-center justify-center gap-1 py-1 text-text-muted hover:text-brand relative transition-colors"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Cart</span>
          </button>
        </div>
      </div>
    </>
  );
}
