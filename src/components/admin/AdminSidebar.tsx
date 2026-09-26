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
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

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
        { label: 'Store Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
        { label: 'Analytics & Sales', href: '/admin/analytics', icon: BarChart3, perm: 'analytics.view' },
      ],
    },
    {
      title: 'Content & Marketing',
      items: [
        { label: 'CMS Dashboard', href: '/admin/marketing', icon: LayoutDashboard, exact: true, perm: 'banners.view' },
        { label: 'Banners & Hero', href: '/admin/marketing/banners', icon: Tv, perm: 'banners.view' },
        { label: 'Campaigns', href: '/admin/marketing/campaigns', icon: Flag, perm: 'campaigns.view' },
        { label: 'Promotions', href: '/admin/marketing/promotions', icon: Tags, perm: 'promotions.view' },
        { label: 'Events & Workshops', href: '/admin/marketing/events', icon: Calendar, perm: 'events.view' },
        { label: 'Announcements', href: '/admin/marketing/announcements', icon: Megaphone, perm: 'announcements.view' },
        { label: 'Coupons & Discounts', href: '/admin/marketing/coupons', icon: Ticket, perm: 'coupons.view' },
        { label: 'Media Library', href: '/admin/marketing/media', icon: ImageIcon, perm: 'media.view' },
      ],
    },
    {
      title: 'Store & Inventory',
      items: [
        { label: 'Products', href: '/admin/products', icon: Package, perm: 'products.view' },
        { label: 'Categories', href: '/admin/categories', icon: FolderTree, perm: 'categories.view' },
        { label: 'Collections', href: '/admin/collections', icon: Layers, perm: 'collections.view' },
        { label: 'Inventory', href: '/admin/inventory', icon: Boxes, perm: 'inventory.view' },
        { label: 'Customer Reviews', href: '/admin/reviews', icon: Star, perm: 'reviews.view' },
      ],
    },
    {
      title: 'Orders & Customers',
      items: [
        { label: 'All Orders', href: '/admin/orders', icon: ShoppingBag, perm: 'orders.view' },
        { label: 'Customers', href: '/admin/customers', icon: Users, perm: 'customers.view' },
      ],
    },
    {
      title: 'Administration & RBAC',
      items: [
        { label: 'Administrators', href: '/admin/administrators', icon: UserCheck, perm: 'admins.view' },
        { label: 'Roles & Permissions', href: '/admin/roles', icon: ShieldCheck, perm: 'roles.view' },
      ],
    },
    {
      title: 'System & Settings',
      items: [
        { label: 'Recommendations', href: '/admin/recommendations', icon: Sparkles, perm: 'products.view' },
        { label: 'Store & Shipping', href: '/admin/settings/site', icon: Settings, perm: 'settings.view' },
        { label: 'SEO Settings', href: '/admin/settings/seo', icon: Globe, perm: 'settings.view' },
        { label: 'Audit Trail', href: '/admin/audit-logs', icon: History, perm: 'audit_logs.view' },
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

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-surface border-b border-border p-4 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-text-main hover:text-brand rounded-lg hover:bg-surface-muted"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-display font-bold text-sm text-text-main">
            TheBloomingHer Admin
          </span>
        </div>

        <Link
          href="/"
          target="_blank"
          className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
        >
          <span>View Store</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border/80">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand/20 shadow-xs flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-text-main block leading-tight">
                TheBloomingHer
              </span>
              <span className="text-[10px] text-brand uppercase font-bold tracking-wider">
                Store CMS & RBAC
              </span>
            </div>
          </Link>

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
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-brand text-white shadow-sm'
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
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Logging out...' : 'Sign Out Admin'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
