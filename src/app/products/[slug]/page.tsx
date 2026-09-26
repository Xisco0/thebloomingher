import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, ShieldCheck, Truck, MapPin, ChevronRight } from 'lucide-react';
import { catalogService, recommendationService } from '@/services';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductBuyActions } from '@/components/product/ProductBuyActions';
import { ProductAccordions } from '@/components/product/ProductAccordions';
import { ProductReviews } from '@/components/product/ProductReviews';
import { StickyMobileBuyBar } from '@/components/product/StickyMobileBuyBar';
import { FrequentlyBoughtTogether } from '@/components/recommendation/FrequentlyBoughtTogether';
import { RecommendedProductsGrid } from '@/components/recommendation/RecommendedProductsGrid';
import { RecentlyViewedSection } from '@/components/recommendation/RecentlyViewedSection';
import { ProductViewTracker } from '@/components/product/ProductViewTracker';
import { formatNaira } from '@/lib/utils/currency';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo/schema';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await catalogService.getProductBySlug(params.slug);
  if (!product) return { title: 'Product Not Found' };

  const primaryImage = product.images?.[0]?.url || '/images/og-default.jpg';

  return {
    title: product.seo_title || `${product.name} | TheBloomingHer Care & Wellness`,
    description: product.seo_description || product.short_description || product.description,
    alternates: {
      canonical: `https://thebloomingher.com/products/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: `Buy ${product.name} in Lagos, Nigeria. ${formatNaira(product.price)}. Fast delivery.`,
      url: `https://thebloomingher.com/products/${product.slug}`,
      images: [{ url: primaryImage, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.short_description || product.description,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await catalogService.getProductBySlug(params.slug);
  if (!product) notFound();

  const [relatedProducts, bundleProducts, reviews] = await Promise.all([
    recommendationService.getRelatedProducts(product.id, product.category_id || undefined, 4),
    recommendationService.getFrequentlyBoughtTogether(product.id),
    catalogService.getProductReviews(product.id),
  ]);

  const productSchema = generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thebloomingher.com' },
    { name: product.category_name || 'Shop', url: `https://thebloomingher.com/categories/${product.category_id}` },
    { name: product.name, url: `https://thebloomingher.com/products/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="w-[85%] max-w-[85%] mx-auto py-6 sm:py-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link href="/products" className="hover:text-brand transition-colors">
            Shop
          </Link>
          {product.category_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <Link
                href={`/categories/${product.category_name.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-brand transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-text-main font-semibold truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Product Layout (Desktop Gallery 55% / Buy Box 45%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Buy Box & Product Info */}
          <div className="lg:col-span-5 space-y-5">
            {/* Category & SKU */}
            <div className="flex justify-between items-center text-xs text-text-muted">
              <span className="uppercase tracking-wider font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full">
                {product.category_name}
              </span>
              <span>SKU: {product.sku}</span>
            </div>

            {/* Product Title */}
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main leading-tight">
              {product.name}
            </h1>

            {/* Rating and Social Proof */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="font-medium text-text-main">5.0</span>
              <span>•</span>
              <span className="underline">{product.rating_count || 18} Verified Customer Reviews</span>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-display font-bold text-2xl sm:text-3xl text-brand font-sans">
                {formatNaira(product.price)}
              </span>
              {product.compare_at_price && (
                <span className="text-base text-text-muted line-through font-sans">
                  {formatNaira(product.compare_at_price)}
                </span>
              )}
              {product.stock_quantity > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  In Stock ({product.stock_quantity} available)
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-text-body/90 leading-relaxed">
              {product.short_description || product.description}
            </p>

            {/* Action Buttons (Add to Bag / Buy Now / WhatsApp) */}
            <ProductBuyActions product={product} />

            {/* Trust Callout Pills */}
            <div className="bg-surface-muted rounded-2xl p-4 border border-border/80 space-y-2 text-xs text-text-body">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand flex-shrink-0" />
                <span>
                  <strong>Lagos Delivery:</strong> 24–48 Hours. Free on orders above ₦40,000.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                <span>
                  <strong>Store Pickup:</strong> 30 Clem Rd, Ifako-Ijaiye, Lagos.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0" />
                <span>
                  <strong>Secure Checkout:</strong> Paystack (Debit Cards, Direct Bank Transfer, USSD).
                </span>
              </div>
            </div>

            {/* Structured Accordions (Benefits, Usage, Ingredients, Delivery) */}
            <ProductAccordions product={product} />
          </div>
        </div>

        {/* Product View Tracker for Personalization & Analytics */}
        <ProductViewTracker productId={product.id} categoryId={product.category_id} />

        {/* Frequently Bought Together Bundle */}
        <FrequentlyBoughtTogether currentProduct={product} />

        {/* Recommended Products: You May Also Like */}
        <div className="pt-12 border-t border-border">
          <RecommendedProductsGrid
            context="product"
            productId={product.id}
            title={`You May Also Like in ${product.category_name || 'Wellness'}`}
            subtitle="Curated complementary period care & intimate hygiene recommendations."
            limit={4}
          />
        </div>

        {/* Customer Reviews Section */}
        <ProductReviews
          productId={product.id}
          productName={product.name}
          initialReviews={reviews}
          averageRating={product.rating || 5.0}
          totalReviews={product.rating_count || 18}
        />

        {/* Recently Viewed Shelf */}
        <RecentlyViewedSection currentProductId={product.id} />

        {/* Mobile Sticky Buy Bar */}
        <StickyMobileBuyBar product={product} />
      </div>
    </>
  );
}
