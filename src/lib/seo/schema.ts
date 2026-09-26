import { Product } from '@/types';
import { getSiteUrl } from '@/lib/site-url';

export function generateProductSchema(product: Product, siteUrl = getSiteUrl()) {
  const primaryImage = product.images?.[0]?.url || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map(img => img.url) || [primaryImage],
    description: product.short_description || product.description,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'TheBloomingHer Care & Wellness',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: 'NGN',
      price: product.price.toString(),
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock_quantity > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'TheBloomingHer Care & Wellness',
      },
    },
    ...(product.rating_count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.toString(),
            reviewCount: product.rating_count.toString(),
          },
        }
      : {}),
  };
}

export function generateLocalBusinessSchema(siteUrl = getSiteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: 'TheBloomingHer Care & Wellness',
    image: `${siteUrl}/images/logo.jpg`,
    '@id': `${siteUrl}/#organization`,
    url: siteUrl,
    telephone: '+2348103641002',
    priceRange: '₦400 - ₦35,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '30 Clem Rd, Ifako-Ijaiye',
      addressLocality: 'Lagos',
      postalCode: '101232',
      addressRegion: 'Lagos',
      addressCountry: 'NG',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 6.6342,
      longitude: 3.3289,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '18:00',
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationSchema(siteUrl = getSiteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TheBloomingHer Care & Wellness',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.jpg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+2348103641002',
      contactType: 'customer service',
      areaServed: 'NG',
      availableLanguage: ['en'],
    },
    sameAs: [
      'https://wa.me/2348103641002',
    ],
  };
}

