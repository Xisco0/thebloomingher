import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Our Brand & Mission | TheBloomingHer Care & Wellness',
  description:
    'Discover the story behind TheBloomingHer. Feminine wellness, cycle care boxes, and thoughtful lifestyle essentials created for women in Nigeria.',
  alternates: {
    canonical: 'https://thebloomingher.com/about',
  },
  openGraph: {
    title: 'About Our Brand & Mission | TheBloomingHer Care & Wellness',
    description:
      'Discover the story behind TheBloomingHer. Feminine wellness, cycle care boxes, and thoughtful lifestyle essentials created for women in Nigeria.',
    url: 'https://thebloomingher.com/about',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'About TheBloomingHer Care & Wellness',
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <div className="w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-16">
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4" data-aos="fade-up">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          Our Brand Philosophy
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-5xl text-text-main leading-tight">
          Nurture yourself.{' '}
          <span className="text-brand italic font-normal">Naturally.</span>
        </h1>
        <p className="text-base sm:text-lg text-text-body/90 leading-relaxed">
          At TheBloomingHer, we believe every woman deserves to feel confident, cared for, and in tune with her body.
        </p>
      </div>

      {/* Main Story Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white" data-aos="fade-right">
          <Image
            src="https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg"
            alt="TheBloomingHer Founder Story"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="space-y-4 text-sm sm:text-base text-text-body leading-relaxed" data-aos="fade-left">
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
            Products Chosen With You In Mind
          </h2>
          <p>
            We are a feminine wellness brand created to support women through every phase of their journey — from cycle care to self-care and everything in between. Our products are thoughtfully curated to combine comfort, quality, and intention, helping you prioritize your well-being without stress or confusion.
          </p>
          <p>
            TheBloomingHer was born from a simple idea: that wellness should feel personal, accessible, and empowering. In a world where women often put themselves last, we exist to remind you to pause, nurture yourself, and bloom at your own pace.
          </p>
          <p>
            From our signature period care boxes to our herbal blends and lifestyle essentials, every product is designed with you in mind — your needs, your comfort, your confidence.
          </p>
        </div>
      </div>

      {/* Second Story Section */}
      <div 
        className="bg-brand-light/40 rounded-3xl p-8 sm:p-12 border border-brand/10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        data-aos="fade-up"
      >
        <div className="space-y-4 text-sm sm:text-base text-text-body leading-relaxed">
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
            More Than A Store. A Lifestyle Of Care.
          </h2>
          <p>
            Feminine wellness is at the heart of what we do, but our vision goes beyond period care. We bring together feminine essentials, wellness and body care, comfort products, beauty and self-care items, and practical everyday essentials — all thoughtfully selected to support the different moments of your life.
          </p>
          <p>
            Because caring for yourself isn’t an occasional activity. It’s a lifestyle.
          </p>

          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-sm shadow-md transition-colors"
            >
              <span>Explore Our Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-white">
          <Image
            src="https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg"
            alt="Lifestyle of Care"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
