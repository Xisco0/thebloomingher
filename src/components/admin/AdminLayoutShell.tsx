'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminSessionGuard } from '@/components/admin/AdminSessionGuard';

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [admin, setAdmin] = React.useState<{ full_name: string; email: string; role_name?: string } | null>(null);

  React.useEffect(() => {
    if (!isLoginPage) {
      fetch('/api/auth/admin/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.admin) {
            setAdmin(data.admin);
          }
        })
        .catch(() => {});
    }
  }, [isLoginPage]);

  // If on login page, render clean standalone page without sidebar or admin header
  if (isLoginPage) {
    return <>{children}</>;
  }

  const initials = admin?.full_name
    ? admin.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TB';

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-text-body font-sans flex flex-col lg:flex-row">
      <AdminSessionGuard />
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-surface border-b border-border/80 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Storefront Connected
            </span>
            <span className="text-xs text-text-muted">
              Lagos, Nigeria (WAT)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand bg-brand-light/60 hover:bg-brand-light border border-brand/20 transition-colors"
            >
              <span>View Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-text-main leading-tight">
                  {admin?.full_name || 'Store Administrator'}
                </p>
                <p className="text-[10px] text-text-muted">
                  {admin?.email || 'admin@thebloomingher.com'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
