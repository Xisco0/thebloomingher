import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, User, BookOpen, ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog-data';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Feminine Care & Period Wellness Blog | TheBloomingHer Nigeria',
  description:
    'Expert tips, period care guides, menstrual comfort advice, and feminine hygiene essentials for women in Lagos and across Nigeria.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Feminine Care & Period Wellness Blog | TheBloomingHer Nigeria',
    description:
      'Discover guides on menstrual heating belts, period care kits, and daily intimate hygiene for women in Nigeria.',
    url: '/blog',
  },
};

export default function BlogIndexPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Care & Wellness Blog', url: `${siteUrl}/blog` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-text-main font-semibold">Care & Wellness Blog</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-light via-surface to-brand-light/40 rounded-3xl p-6 sm:p-10 border border-brand/20 shadow-xs space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand text-white shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
            Educational Guides & Advice
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-4xl text-text-main">
            Feminine Care & Period Wellness Blog
          </h1>
          <p className="text-xs sm:text-sm text-text-body leading-relaxed">
            Practical advice, cycle comfort tips, period care kit guides, and feminine hygiene essentials designed for women living in Lagos and across Nigeria.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {BLOG_POSTS.map(post => (
            <article
              key={post.slug}
              className="bg-surface rounded-3xl border border-border overflow-hidden shadow-subtle hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      {post.readingTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-brand" />
                      {post.author}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-lg text-text-main group-hover:text-brand transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-text-body/80 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
