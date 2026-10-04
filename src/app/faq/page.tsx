import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FaqSection } from '@/components/home/FaqSection';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import { getSiteUrl } from '@/lib/site-url';
import { cmsService } from '@/services/cms.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | TheBloomingHer Care & Wellness',
  description:
    'Find answers to your questions about Lagos same-day delivery, 100% discreet packaging, organic sanitary pads, payment security, and return policies.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions | TheBloomingHer Care & Wellness',
    description:
      'Answers to common questions about period care, Lagos delivery, discreet shipping, and orders.',
    url: '/faq',
  },
};

export default async function FaqPage() {
  const siteUrl = getSiteUrl();
  const faqs = await cmsService.getPublicFaqs();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Frequently Asked Questions', url: `${siteUrl}/faq` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto pt-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto whitespace-nowrap mb-4">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-text-main font-semibold">FAQ</span>
        </nav>
      </div>

      <FaqSection showTitle={true} initialFaqs={faqs} />
    </>
  );
}
