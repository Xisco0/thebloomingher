import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AOSProvider } from '@/components/providers/AOSProvider';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { generateLocalBusinessSchema, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo/schema';

import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    default: 'Feminine Care & Wellness Products in Nigeria | TheBloomingHer',
    template: '%s | TheBloomingHer Care & Wellness',
  },
  description:
    'Shop authentic feminine care, period care kits, menstrual heating belts, intimate hygiene essentials, and wellness products in Lagos, Nigeria. Same-day delivery & local pickup.',
  metadataBase: new URL(siteUrl),
  keywords: [
    'feminine care products Nigeria',
    'feminine care products Lagos',
    'period care products Nigeria',
    'menstrual heating belt Nigeria',
    'feminine hygiene products Lagos',
    'women self care products Nigeria',
    'TheBloomingHer Care & Wellness',
  ],
  authors: [{ name: 'TheBloomingHer Care & Wellness' }],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'TheBloomingHer Care & Wellness',
    title: 'Feminine Care & Wellness Products in Nigeria | TheBloomingHer',
    description: 'Thoughtfully curated feminine care, menstrual comfort kits, and everyday wellness essentials.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'TheBloomingHer Care & Wellness — Thoughtfully selected essentials for your care, comfort & lifestyle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheBloomingHer Care & Wellness',
    description: 'Feminine care, cycle kits, and wellness essentials for women in Nigeria.',
    images: ['/images/og-default.jpg'],
  },
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localBusinessSchema = generateLocalBusinessSchema();
  const organizationSchema = generateOrganizationSchema();
  const webSiteSchema = generateWebSiteSchema();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-background text-text-body antialiased overflow-x-hidden w-full max-w-[100vw] relative">
        <AOSProvider>
          <CartProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </CartProvider>
        </AOSProvider>
      </body>
    </html>
  );
}
