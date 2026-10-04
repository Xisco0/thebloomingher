import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, User, ArrowLeft, ShoppingBag } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog-data';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import { getSiteUrl } from '@/lib/site-url';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = BLOG_POSTS.find(p => p.slug === params.slug);
  if (!post) return { title: 'Article Not Found' };

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      images: [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = BLOG_POSTS.find(p => p.slug === params.slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Care Blog', url: `${siteUrl}/blog` },
    { name: post.title, url: articleUrl },
  ]);

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    author: {
      '@type': 'Organization',
      name: 'TheBloomingHer Care & Wellness',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TheBloomingHer Care & Wellness',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/logo.jpg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  const otherPosts = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />

      <div className="w-[94%] sm:w-[90%] md:w-[80%] max-w-[80%] mx-auto py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link href="/blog" className="hover:text-brand transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-text-main font-semibold truncate max-w-[200px] sm:max-w-none">
            {post.title}
          </span>
        </nav>

        {/* Back Link */}
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Care Guides</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="space-y-4 max-w-3xl">
          <span className="px-3 py-1 bg-brand-light text-brand text-xs font-bold uppercase tracking-wider rounded-full">
            {post.category}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-4xl text-text-main leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-text-muted border-b border-border pb-4">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-brand" />
              {post.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand" />
              {post.readingTime}
            </span>
            <span>•</span>
            <span>Published {post.publishDate}</span>
          </div>
        </header>

        {/* Featured Cover Image */}
        <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden shadow-md border border-border">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>

        {/* Article Content Body */}
        <article className="prose prose-pink max-w-3xl text-text-body text-sm sm:text-base leading-relaxed space-y-6">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Related Product Callouts */}
        {post.relatedProducts && post.relatedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-brand-light/70 via-surface to-brand-light/30 rounded-3xl p-6 sm:p-8 border border-brand/20 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" />
              <h3 className="font-display font-bold text-lg text-text-main">
                Featured Care Products Mentioned in Article
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.relatedProducts.map((prod, i) => (
                <Link
                  key={i}
                  href={prod.url}
                  className="bg-surface rounded-2xl p-4 border border-border hover:border-brand/40 shadow-xs transition-all flex items-center gap-4 group"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                    <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-main group-hover:text-brand transition-colors line-clamp-2">
                      {prod.name}
                    </h4>
                    <span className="text-xs font-bold text-brand block mt-1">{prod.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles Footer */}
        {otherPosts.length > 0 && (
          <div className="pt-10 border-t border-border max-w-3xl space-y-6">
            <h3 className="font-display font-bold text-xl text-text-main">
              More Recommended Care Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {otherPosts.map(op => (
                <Link
                  key={op.slug}
                  href={`/blog/${op.slug}`}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-brand/40 shadow-xs transition-all space-y-2 group"
                >
                  <span className="text-[10px] uppercase tracking-wider font-bold text-brand">
                    {op.category}
                  </span>
                  <h4 className="font-display font-bold text-sm text-text-main group-hover:text-brand transition-colors">
                    {op.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
