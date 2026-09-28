'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Globe, History } from 'lucide-react';

const TABS = [
  { label: 'Store & Shipping', href: '/admin/settings/site', icon: Settings, exact: true },
  { label: 'SEO', href: '/admin/settings/seo', icon: Globe },
  { label: 'Activity', href: '/admin/audit-logs', icon: History },
];

export function SettingsSubNav() {
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
