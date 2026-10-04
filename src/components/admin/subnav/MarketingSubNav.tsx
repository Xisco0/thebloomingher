'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tv,
  Flag,
  Tags,
  Calendar,
  Megaphone,
  Ticket,
  ImageIcon,
  HelpCircle,
} from 'lucide-react';

const TABS = [
  { label: 'Overview', href: '/admin/marketing', icon: LayoutDashboard, exact: true },
  { label: 'Banners', href: '/admin/marketing/banners', icon: Tv },
  { label: 'Campaigns', href: '/admin/marketing/campaigns', icon: Flag },
  { label: 'Promotions', href: '/admin/marketing/promotions', icon: Tags },
  { label: 'Events', href: '/admin/marketing/events', icon: Calendar },
  { label: 'Announcements', href: '/admin/marketing/announcements', icon: Megaphone },
  { label: 'FAQs', href: '/admin/marketing/faqs', icon: HelpCircle },
  { label: 'Coupons', href: '/admin/marketing/coupons', icon: Ticket },
  { label: 'Media', href: '/admin/marketing/media', icon: ImageIcon },
];

export function MarketingSubNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 scrollbar-none mb-6">
      {TABS.map(tab => {
        const active = isActive(tab.href, tab.exact);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              active
                ? 'bg-brand text-white shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-muted text-text-muted hover:text-text-main border border-border/80'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-text-muted'}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
