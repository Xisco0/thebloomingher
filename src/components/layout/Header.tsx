'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, Heart, Menu, X, ChevronDown, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';

export function Header() {
  const { totalItemsCount, openCart, subtotal, wishlist } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { name: 'Feminine Care', href: '/categories/feminine-care' },
    { name: 'Everyday Essentials', href: '/categories/everyday-essentials' },
    { name: 'Wellness & Body Care', href: '/categories/wellness-body-care' },
    { name: 'Comfort & Relaxation', href: '/categories/comfort-relaxation' },
    { name: 'Beauty & Self-Care', href: '/categories/beauty-self-care' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-subtle">
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-text-main hover:text-brand focus:outline-none flex-shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0 mr-1 xl:mr-6">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-brand/20 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="TheBloomingHer Logo"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col flex-shrink-0">
              <span className="font-display font-semibold text-sm xs:text-base sm:text-lg lg:text-xl text-text-main tracking-tight group-hover:text-brand transition-colors whitespace-nowrap">
                TheBloomingHer
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-brand font-medium -mt-0.5 sm:-mt-1 whitespace-nowrap">
                Care & Wellness
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 font-medium text-sm text-text-main flex-shrink-0">
            <Link href="/" className="hover:text-brand transition-colors whitespace-nowrap">
              Home
            </Link>

            <Link href="/shop" className="hover:text-brand transition-colors whitespace-nowrap">
              Shop All
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-brand transition-colors py-2 focus:outline-none whitespace-nowrap">
                <span>Categories</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 text-text-muted" />
              </button>

              <div className="absolute top-full left-0 w-60 bg-surface rounded-xl shadow-elevated border border-border p-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                {categories.map(cat => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="block px-3 py-2 rounded-lg text-sm text-text-main hover:bg-brand-light hover:text-brand font-normal transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/collections/bloomie-care"
              className="px-3 py-1 bg-brand-light text-brand rounded-full text-xs font-semibold hover:bg-brand hover:text-white transition-all shadow-sm whitespace-nowrap flex-shrink-0"
            >
              Bloomie Care Box 🌸
            </Link>

            <Link href="/about" className="hover:text-brand transition-colors whitespace-nowrap">
              About Us
            </Link>
            
            <Link href="/contact" className="hover:text-brand transition-colors whitespace-nowrap">
              Contact
            </Link>
          </nav>

          {/* Right Icons: Search, Wishlist, Account, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 xl:gap-3.5 flex-shrink-0 ml-auto lg:ml-0">
            {/* Search Trigger */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-search-modal'))}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-full text-text-muted hover:text-brand hover:bg-brand-light transition-all border border-border/80 text-xs whitespace-nowrap"
              aria-label="Search Catalog"
            >
              <Search className="w-4 h-4 text-text-main" />
              <span className="hidden xl:inline text-xs text-text-muted">Search wellness...</span>
            </button>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-2 text-text-main hover:text-brand hover:bg-brand-light rounded-full transition-colors hidden sm:flex flex-shrink-0"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account Link */}
            <Link
              href="/account"
              className="p-2 text-text-main hover:text-brand hover:bg-brand-light rounded-full transition-colors hidden sm:flex flex-shrink-0"
              aria-label="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={openCart}
              className="flex items-center gap-1.5 sm:gap-2 bg-brand hover:bg-brand-hover text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap flex-shrink-0"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-semibold text-xs sm:text-sm">{totalItemsCount}</span>
              <span className="hidden md:inline text-xs text-brand-light border-l border-white/20 pl-2">
                {formatNaira(subtotal)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-surface px-4 pt-3 pb-6 space-y-3 shadow-elevated">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-text-main hover:text-brand"
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-text-main hover:text-brand"
          >
            Shop All
          </Link>
          <div className="py-2">
            <span className="text-xs uppercase tracking-wider text-text-muted font-bold">Categories</span>
            <div className="mt-2 space-y-2 pl-3">
              {categories.map(cat => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 text-sm text-text-body hover:text-brand"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/collections/bloomie-care"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-semibold text-brand"
          >
            🌸 Bloomie Care Period Kits
          </Link>
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-text-main hover:text-brand"
          >
            My Account & Orders
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-text-main hover:text-brand"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 font-medium text-text-main hover:text-brand"
          >
            Contact & Lagos Location
          </Link>
        </div>
      )}
    </header>
  );
}
