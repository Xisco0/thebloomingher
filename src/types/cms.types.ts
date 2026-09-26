export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  highlightedTitle: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageUrl: string;
}

export interface SplitPromoBanner {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  theme: 'plum' | 'wellness';
}

export interface CustomerTestimonial {
  id: string;
  customerName: string;
  avatarUrl?: string;
  rating: number;
  quote: string;
  location?: string;
  verifiedPurchase: boolean;
}

export interface HomepageConfig {
  announcementText: string;
  freeShippingThreshold: number;
  heroSlides: HeroSlide[];
  splitBanners: {
    left: SplitPromoBanner;
    right: SplitPromoBanner;
  };
  featuredCategorySlugs: string[];
  bestSellerProductSlugs: string[];
  testimonials: CustomerTestimonial[];
}

export interface DiscountCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // percentage e.g. 10 or fixed Naira amount e.g. 2000
  min_spend?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  first_order_only?: boolean;
  created_at: string;
}

export interface PromotionCampaign {
  id: string;
  title: string;
  slug: string;
  banner_image?: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
  discount_percentage?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  placement: 'homepage' | 'category' | 'product_banner' | 'global';
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SiteSettings {
  business_name: string;
  tagline: string;
  logo_url: string;
  address: string;
  phone: string;
  whatsapp_number: string;
  support_email: string;
  opening_hours: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  free_shipping_threshold: number;
  lagos_delivery_fee: number;
  nationwide_delivery_fee: number;
  site_title: string;
  site_description: string;
  default_og_image: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
}
