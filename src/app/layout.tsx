import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AOSProvider } from '@/components/providers/AOSProvider';
import { StorefrontShell } from '@/components/layout/StorefrontShell';
import { generateLocalBusinessSchema, generateOrganizationSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: {
    default: 'TheBloomingHer Care & Wellness | Thoughtful Care for Women in Nigeria',
    template: '%s | TheBloomingHer Care & Wellness',
  },
  description:
    'Thoughtfully curated feminine care, menstrual comfort kits, wellness supplements, and everyday essentials in Lagos, Nigeria. Fast delivery & local pickup.',
  metadataBase: new URL('https://thebloomingher.com'),
  keywords: [
    'feminine care Nigeria',
    'period care box Lagos',
    'menstrual heating belt',
    'wellness products Lagos',
    'TheBloomingHer Care & Wellness',
    'self-care essentials Nigeria',
  ],
  authors: [{ name: 'TheBloomingHer Care & Wellness' }],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://thebloomingher.com',
    siteName: 'TheBloomingHer Care & Wellness',
    title: 'TheBloomingHer Care & Wellness | Thoughtful Care for Women',
    description: 'Thoughtfully curated feminine care, menstrual comfort kits, and everyday wellness essentials.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
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
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-background text-text-body antialiased">
        <AOSProvider>
          <CartProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </CartProvider>
        </AOSProvider>
      </body>
    </html>
  );
}
