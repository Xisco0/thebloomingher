'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SearchModal } from '@/components/search/SearchModal';

interface StorefrontShellProps {
  children: React.ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow pb-16 md:pb-0 overflow-x-hidden w-full max-w-full">{children}</main>
      <Footer />
      <MobileNav />
      <CartDrawer />
      <SearchModal />
    </>
  );
}
