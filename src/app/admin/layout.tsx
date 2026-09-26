import React from 'react';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const metadata = {
  title: 'Admin CMS | TheBloomingHer Care & Wellness',
  description: 'Store administration, catalogue management, order fulfillment, and marketing controls.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
