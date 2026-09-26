'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, Heart, Menu, X, ChevronDown, User, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';

export function Header() {
  const { totalItemsCount, openCart, subtotal, wishlist } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on ESC key and prevent body scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

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
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-1.5 sm:p-2 text-text-main hover:text-brand focus:outline-none flex-shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
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

      {/* Mobile Modal Drawer with Backdrop Click-to-Close (Portaled directly to body) */}
      {mounted && mobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-brand-dark/60 backdrop-blur-sm flex animate-in fade-in duration-200 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div
            className="w-[85%] max-w-sm h-full bg-surface shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 border-r border-border"
            onClick={e => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-muted/50">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand/20 shadow-sm">
                    <Image
                      src="/images/logo.jpg"
                      alt="TheBloomingHer Logo"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display font-semibold text-sm text-text-main tracking-tight">
                      TheBloomingHer
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-brand font-medium -mt-0.5">
                      Care & Wellness
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface transition-colors"
                  aria-label="Close Mobile Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-text-main hover:bg-brand-light hover:text-brand transition-colors"
                >
                  <span>Home</span>
                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </Link>

                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-text-main hover:bg-brand-light hover:text-brand transition-colors"
                >
                  <span>Shop All Products</span>
                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </Link>

                <div className="pt-2 pb-1">
                  <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                    Product Categories
                  </span>
                  <div className="mt-1.5 space-y-0.5 pl-2">
                    {categories.map(cat => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-text-body hover:text-brand hover:bg-brand-light rounded-lg transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/collections/bloomie-care"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm bg-brand-light text-brand hover:bg-brand hover:text-white transition-colors"
                  >
                    <span>🌸 Bloomie Care Period Box</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-1">
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-text-main hover:bg-brand-light hover:text-brand transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-brand" />
                      <span>Saved Wishlist</span>
                    </div>
                    {wishlist.length > 0 && (
                      <span className="px-2 py-0.5 bg-brand text-white text-[10px] font-bold rounded-full">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-text-main hover:bg-brand-light hover:text-brand transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-brand" />
                      <span>My Account & Orders</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </Link>

                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-text-main hover:bg-brand-light hover:text-brand transition-colors"
                  >
                    <span>About Us</span>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm text-text-main hover:bg-brand-light hover:text-brand transition-colors"
                  >
                    <span>Contact & Lagos Location</span>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Drawer Footer CTA */}
            <div className="p-4 border-t border-border bg-surface-muted/40 text-center">
              <p className="text-xs text-text-muted">
                Premium Feminine Care & Wellness • Lagos, Nigeria
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
