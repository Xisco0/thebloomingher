import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/checkout',
        '/checkout/',
        '/cart',
        '/wishlist',
        '/order-confirmation/',
        '/api/',
      ],
    },
    sitemap: 'https://thebloomingher.com/sitemap.xml',
  };
}
