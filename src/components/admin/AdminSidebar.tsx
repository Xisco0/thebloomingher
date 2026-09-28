'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  Layers,
  Star,
  ShoppingBag,
  Users,
  Percent,
  Sparkles,
  Settings,
  Globe,
  BarChart3,
  History,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  LogOut,
  ImageIcon,
  Calendar,
  Megaphone,
  Flag,
  Ticket,
  Tv,
  Tags,
  ShieldCheck,
  UserCheck,
  KeyRound,
} from 'lucide-react';

import { SignOutConfirmModal } from '@/components/admin/SignOutConfirmModal';

interface CurrentAdmin {
  id: string;
  email: string;
  full_name: string;
  role_name: string;
  role: string;
  permissions?: string[];
  must_change_password?: boolean;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    fetch('/api/auth/admin/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.admin) {
          setAdmin(data.admin);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      setShowSignOutModal(false);
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const userPermissions = admin?.permissions || [];
  const isSuperAdmin = admin?.role === 'super_admin' || userPermissions.includes('*');

  const checkPerm = (perm?: string) => {
    if (!perm) return true;
    if (isSuperAdmin) return true;
    if (userPermissions.includes(perm)) return true;
    const [mod] = perm.split('.');
    return userPermissions.includes(`${mod}.*`);
  };

  const rawNavGroups = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: 'Sales',
          href: '/admin/analytics',
          icon: BarChart3,
          perm: 'analytics.view',
        },
      ],
    },
    {
      title: 'Store',
      items: [
        {
          label: 'Products',
          href: '/admin/products',
          icon: Package,
          perm: 'products.view',
          activeMatch: ['/admin/products', '/admin/categories', '/admin/collections', '/admin/recommendations'],
        },
        {
          label: 'Orders',
          href: '/admin/orders',
          icon: ShoppingBag,
          perm: 'orders.view',
        },
        {
          label: 'Customers',
          href: '/admin/customers',
          icon: Users,
          perm: 'customers.view',
        },
        {
          label: 'Stock',
          href: '/admin/inventory',
          icon: Boxes,
          perm: 'inventory.view',
        },
        {
          label: 'Reviews',
          href: '/admin/reviews',
          icon: Star,
          perm: 'reviews.view',
        },
      ],
    },
    {
      title: 'Marketing',
      items: [
        {
          label: 'Marketing & Content',
          href: '/admin/marketing',
          icon: Sparkles,
          perm: 'banners.view',
          activeMatch: ['/admin/marketing', '/admin/discounts', '/admin/promotions'],
        },
      ],
    },
    {
      title: 'Team',
      items: [
        {
          label: 'Staff',
          href: '/admin/administrators',
          icon: UserCheck,
          perm: 'admins.view',
          activeMatch: ['/admin/administrators', '/admin/roles'],
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          label: 'Settings',
          href: '/admin/settings/site',
          icon: Settings,
          perm: 'settings.view',
          activeMatch: ['/admin/settings', '/admin/audit-logs'],
        },
      ],
    },
  ];

  // Filter items based on administrator's permissions
  const navGroups = rawNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => checkPerm(item.perm)),
    }))
    .filter(group => group.items.length > 0);

  const isActive = (item: { href: string; exact?: boolean; activeMatch?: string[] }) => {
    if (item.exact) return pathname === item.href;
    if (item.activeMatch) {
      return item.activeMatch.some(match => pathname.startsWith(match));
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-surface border-b border-border px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-10 h-10 flex items-center justify-center text-text-main hover:text-brand rounded-xl hover:bg-surface-muted transition-colors flex-shrink-0"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-brand/20 shadow-xs flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="Logo"
                fill
                className="object-cover"
              />
            </div>
            <div className="truncate">
              <span className="font-display font-bold text-sm text-text-main block leading-tight truncate">
                TheBloomingHer
              </span>
              <span className="text-[9px] text-brand font-bold uppercase tracking-wider block">
                Admin
              </span>
            </div>
          </Link>
        </div>

        <Link
          href="/"
          target="_blank"
          className="text-xs text-brand font-semibold hover:bg-brand-light px-2.5 py-1.5 rounded-xl border border-brand/20 bg-brand-light/50 flex items-center gap-1 flex-shrink-0 transition-colors"
        >
          <span className="hidden xs:inline">Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 max-w-[85vw] bg-surface border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border/80">
          <div className="flex items-center justify-between">
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand/20 shadow-xs flex-shrink-0">
                <Image
                  src="/images/logo.jpg"
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="truncate">
                <span className="font-display font-bold text-sm text-text-main block leading-tight truncate">
                  TheBloomingHer
                </span>
                <span className="text-[10px] text-brand uppercase font-bold tracking-wider block">
                  Store CMS & RBAC
                </span>
              </div>
            </Link>

            {/* Close Button on Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-text-muted hover:text-text-main hover:bg-surface-muted rounded-xl transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Admin Quick Badge */}
          {admin && (
            <div className="mt-3 p-2 bg-surface-muted rounded-xl border border-border/60 flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-xs font-bold text-text-main block truncate leading-tight">
                  {admin.full_name}
                </span>
                <span className="text-[10px] text-text-muted truncate block">
                  {admin.email}
                </span>
              </div>
              <span className="px-1.5 py-0.5 bg-brand-light text-brand text-[9px] font-bold rounded-md uppercase tracking-wider whitespace-nowrap">
                {admin.role_name || admin.role}
              </span>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-3 block mb-1.5">
                {group.title}
              </span>
              {group.items.map(item => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-brand text-white shadow-sm font-bold'
                        : 'text-text-body hover:bg-surface-muted hover:text-brand'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-text-muted'}`} />
                      <span>{item.label}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer: Password Update, Live Storefront Link & Logout */}
        <div className="p-4 border-t border-border/80 bg-surface-muted/50 space-y-2">
          <Link
            href="/admin/change-password"
            className="w-full py-2 px-3 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-text-muted" />
            <span>Change My Password</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2 px-3 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Open Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        adminEmail={admin?.email}
        adminName={admin?.full_name}
      />
    </>
  );
}
