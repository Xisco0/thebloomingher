import catalogData from '@/lib/data/catalog.json';
import bcrypt from 'bcryptjs';
import { Product, Category, Order, ProductReview } from '@/types';
import {
  DiscountCoupon,
  PromotionCampaign,
  AuditLogEntry,
  SiteSettings,
  CustomerProfile,
  HomepageConfig,
} from '@/types/cms.types';
import {
  MarketingBanner,
  MarketingCampaign,
  MarketingEvent,
  MarketingAnnouncement,
  MediaAsset,
  BannerPlacement,
  BannerFilterOptions,
} from '@/types/marketing-cms.types';
import {
  ProductRelationship,
  CoPurchaseAssociation,
  AnalyticsEvent,
  RecommendationMetrics,
} from '@/types/recommendation.types';
import { AdminUser, CustomerUser, Role, PermissionDefinition, AdminStatus } from '@/types/auth.types';
import { DEFAULT_ROLES, SYSTEM_PERMISSIONS } from '@/lib/auth/rbac';

export interface AdminRecord extends AdminUser {
  password_hash: string;
}

export interface CustomerRecord extends CustomerUser {
  password_hash: string;
}

// Initial Roles State
let rolesState: Role[] = JSON.parse(JSON.stringify(DEFAULT_ROLES));

// Initial Super Admin & Store Admin hashes
const superAdminHash = bcrypt.hashSync('Olaski61', 10);
const storeAdminHash = bcrypt.hashSync('blooming123', 10);

let adminsState: AdminRecord[] = [
  {
    id: 'admin-super-francis',
    email: 'francisbamirin45@gmail.com',
    password_hash: superAdminHash,
    first_name: 'Francis',
    last_name: 'Bamirin',
    full_name: 'Francis Bamirin',
    role_id: 'role-super-admin',
    role_name: 'Super Administrator',
    role: 'super_admin',
    permissions: ['*'],
    status: 'active',
    is_active: true,
    must_change_password: false,
    phone: '+234 814 972 5817',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'admin-store-ops',
    email: 'thebloomingherwellness@gmail.com',
    password_hash: storeAdminHash,
    first_name: 'Blooming',
    last_name: 'Admin',
    full_name: 'TheBloomingHer Store Admin',
    role_id: 'role-admin',
    role_name: 'Administrator',
    role: 'admin',
    permissions: DEFAULT_ROLES.find(r => r.id === 'role-admin')?.permissions || [],
    status: 'active',
    is_active: true,
    must_change_password: false,
    phone: '+234 810 364 1002',
    created_at: '2026-01-01T00:00:00Z',
  },
];

let customersState: CustomerRecord[] = [];

// Default initial state seeded with the real TheBloomingHer data
let productsState: Product[] = JSON.parse(JSON.stringify(catalogData.products));
let categoriesState: Category[] = JSON.parse(JSON.stringify(catalogData.categories));
let deletedProductIdsState: Set<string> = new Set();

let relationshipsState: ProductRelationship[] = [
  {
    id: 'rel-1',
    source_product_id: 'prod-electric-heating-pad',
    target_product_id: 'prod-womb-tea-herbal',
    relationship_type: 'frequently_bought_together',
    priority_weight: 90,
    is_active: true,
    is_manual: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rel-2',
    source_product_id: 'prod-electric-heating-pad',
    target_product_id: 'prod-organic-pant-liners',
    relationship_type: 'complementary',
    priority_weight: 85,
    is_active: true,
    is_manual: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rel-3',
    source_product_id: 'prod-organic-pant-liners',
    target_product_id: 'prod-silicone-menstrual-cup',
    relationship_type: 'related',
    priority_weight: 80,
    is_active: true,
    is_manual: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rel-4',
    source_product_id: 'prod-silicone-menstrual-cup',
    target_product_id: 'prod-disposable-toilet-covers',
    relationship_type: 'complementary',
    priority_weight: 75,
    is_active: true,
    is_manual: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rel-5',
    source_product_id: 'prod-womb-tea-herbal',
    target_product_id: 'prod-electric-heating-pad',
    relationship_type: 'frequently_bought_together',
    priority_weight: 95,
    is_active: true,
    is_manual: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

let coPurchasesState: CoPurchaseAssociation[] = [
  {
    source_product_id: 'prod-electric-heating-pad',
    source_product_name: 'Electric Heating Pad & Cramp Relief Belt',
    target_product_id: 'prod-womb-tea-herbal',
    target_product_name: 'Herbal Womb Comfort Tea Blend',
    frequency: 28,
    confidence_score: 0.88,
    last_occurred_at: '2026-03-15T12:00:00Z',
  },
  {
    source_product_id: 'prod-organic-pant-liners',
    source_product_name: 'Organic Cotton Breathable Pant Liners',
    target_product_id: 'prod-disposable-toilet-covers',
    target_product_name: 'Travel Disposable Toilet Seat Covers',
    frequency: 22,
    confidence_score: 0.76,
    last_occurred_at: '2026-03-18T15:30:00Z',
  },
  {
    source_product_id: 'prod-silicone-menstrual-cup',
    source_product_name: 'Medical Grade Silicone Menstrual Cup',
    target_product_id: 'prod-organic-pant-liners',
    target_product_name: 'Organic Cotton Breathable Pant Liners',
    frequency: 17,
    confidence_score: 0.69,
    last_occurred_at: '2026-03-20T09:45:00Z',
  },
];

let eventsState: AnalyticsEvent[] = [
  {
    id: 'evt-seed-1',
    event_type: 'product_view',
    anonymous_session_id: 'session-demo-visitor',
    product_id: 'prod-electric-heating-pad',
    category_id: 'cat-pain-relief-comfort',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'evt-seed-2',
    event_type: 'product_search',
    anonymous_session_id: 'session-demo-visitor',
    search_query: 'cramps heating belt tea',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
];

let discountsState: DiscountCoupon[] = [
  {
    id: 'disc-1',
    code: 'BLOOM10',
    type: 'percentage',
    value: 10,
    min_spend: 15000,
    max_discount: 5000,
    usage_limit: 500,
    usage_count: 34,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    is_active: true,
    first_order_only: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'disc-2',
    code: 'WELCOME500',
    type: 'fixed_amount',
    value: 500,
    min_spend: 10000,
    usage_limit: 1000,
    usage_count: 82,
    is_active: true,
    first_order_only: true,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'disc-3',
    code: 'FREESHIP40K',
    type: 'fixed_amount',
    value: 2500,
    min_spend: 40000,
    usage_limit: 200,
    usage_count: 19,
    is_active: true,
    first_order_only: false,
    created_at: '2026-02-01T00:00:00Z',
  },
];

let promotionsState: PromotionCampaign[] = [
  {
    id: 'promo-1',
    title: 'March Wellness Flash Sale',
    slug: 'march-wellness-sale',
    banner_image: '/images/logo.jpg',
    description: 'Save up to 15% on period care bundles and organic herbal teas this month.',
    cta_text: 'Shop Flash Sale',
    cta_link: '/collections/period-essentials',
    discount_percentage: 15,
    is_active: true,
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    placement: 'homepage',
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'promo-2',
    title: 'Free Lagos Delivery on Orders Over ₦40,000',
    slug: 'free-lagos-delivery',
    description: 'Shop your monthly feminine essentials and enjoy automatic free doorstep delivery.',
    cta_text: 'Claim Free Delivery',
    cta_link: '/shop',
    is_active: true,
    placement: 'global',
    created_at: '2026-01-01T00:00:00Z',
  },
];

let reviewsState: ProductReview[] = [
  {
    id: 'rev-1',
    product_id: 'prod-electric-heating-pad',
    author_name: 'Chioma A.',
    rating: 5,
    title: 'Super fast delivery in Ikeja & amazing quality!',
    comment: 'I ordered this electric heating pad and received it the next afternoon in Ikeja. The temperature controls and vibration massage ease severe menstrual cramps within 10 minutes.',
    created_at: '2026-03-12T14:20:00Z',
    is_verified_purchase: true,
    helpful_votes: 14,
  },
  {
    id: 'rev-2',
    product_id: 'prod-womb-tea-herbal',
    author_name: 'Zainab B.',
    rating: 5,
    title: 'A true lifesaver for my monthly wellness routine',
    comment: 'Honestly, TheBloomingHer is the only brand in Nigeria I trust with my intimate and period wellness essentials. Warm, soothing, and completely natural.',
    created_at: '2026-02-28T09:15:00Z',
    is_verified_purchase: true,
    helpful_votes: 9,
  },
  {
    id: 'rev-3',
    product_id: 'prod-organic-pant-liners',
    author_name: 'Blessing E.',
    rating: 5,
    title: 'Very practical, ultra-thin and comfortable',
    comment: 'Great value for money. Kept me fresh throughout long office hours in Victoria Island.',
    created_at: '2026-01-19T11:45:00Z',
    is_verified_purchase: true,
    helpful_votes: 6,
  },
  {
    id: 'rev-4',
    product_id: 'prod-silicone-menstrual-cup',
    author_name: 'Amina Y.',
    rating: 5,
    title: 'Game changer for heavy flow days',
    comment: 'I was hesitant at first, but the medical grade silicone is extremely soft and comfortable. Zero leaks for 8 hours.',
    created_at: '2026-03-05T16:30:00Z',
    is_verified_purchase: true,
    helpful_votes: 11,
  },
];

let siteSettingsState: SiteSettings = {
  business_name: 'TheBloomingHer Care & Wellness',
  tagline: 'Premium Feminine Care, Intimate Wellness & Period Essentials in Nigeria',
  logo_url: '/images/logo.jpg',
  address: '30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria',
  phone: '+234 814 972 5817',
  whatsapp_number: '+2348149725817',
  support_email: 'support@thebloomingher.com',
  opening_hours: 'Monday – Saturday: 9:00 AM – 6:00 PM WAT',
  instagram_url: 'https://instagram.com/thebloomingher',
  facebook_url: 'https://facebook.com/thebloomingher',
  tiktok_url: 'https://tiktok.com/@thebloomingher',
  free_shipping_threshold: 40000,
  lagos_delivery_fee: 2500,
  nationwide_delivery_fee: 5000,
  site_title: 'TheBloomingHer Care & Wellness | Empowering Women\'s Health & Comfort',
  site_description: 'Discover premium period care, menstrual pain relief heating belts, organic intimate hygiene, womb teas, and daily wellness essentials delivered discreetly across Nigeria.',
  default_og_image: '/images/og-default.jpg',
};

let homepageConfigState: HomepageConfig = {
  announcementText: 'FREE Lagos Doorstep Delivery on orders over ₦40,000 | Same-Day Lagos Dispatch Available',
  freeShippingThreshold: 40000,
  heroSlides: [
    {
      id: 'slide-1',
      badge: 'Nigeria\'s #1 Trusted Feminine Care',
      title: 'Comfort, Confidence &',
      highlightedTitle: 'Gentle Period Wellness',
      subtitle: 'From intelligent menstrual cramp relief belts to organic cotton hygiene essentials, we empower every woman with doctor-approved comfort.',
      primaryCtaText: 'Shop Best Sellers',
      primaryCtaLink: '/shop',
      secondaryCtaText: 'Relieve Cramp Pain',
      secondaryCtaLink: '/categories/pain-relief-comfort',
      imageUrl: '/images/logo.jpg',
    },
  ],
  splitBanners: {
    left: {
      title: 'Menstrual Pain Relief',
      subtitle: 'Fast, drug-free thermal comfort for peaceful cycles.',
      ctaText: 'Explore Warmth & Belts',
      ctaLink: '/categories/pain-relief-comfort',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
      theme: 'plum',
    },
    right: {
      title: 'Everyday Intimate Hygiene',
      subtitle: 'pH-balanced washes, breathable liners & herbal care.',
      ctaText: 'Shop Intimate Essentials',
      ctaLink: '/categories/intimate-hygiene',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      theme: 'wellness',
    },
  },
  featuredCategorySlugs: [
    'pain-relief-comfort',
    'intimate-hygiene',
    'menstrual-care',
    'health-supplements',
    'on-the-go-essentials',
  ],
  bestSellerProductSlugs: [
    'electric-heating-pad-vibration-cramp-relief-belt',
    'organic-cotton-pant-liners-pack',
    'medical-grade-silicone-menstrual-cup',
    'herbal-womb-comfort-tea-blend',
    'travel-disposable-toilet-seat-covers',
  ],
  testimonials: [
    {
      id: 'test-1',
      customerName: 'Amina Y.',
      rating: 5,
      quote: 'The electric heating belt changed my entire work-from-home experience during my cycle. Fast delivery to Ikeja and discrete packaging!',
      location: 'Ikeja, Lagos',
      verifiedPurchase: true,
    },
    {
      id: 'test-2',
      customerName: 'Chioma O.',
      rating: 5,
      quote: 'I ordered the herbal womb tea and pant liners. Customer support on WhatsApp answered all my questions within 5 minutes.',
      location: 'Victoria Island, Lagos',
      verifiedPurchase: true,
    },
    {
      id: 'test-3',
      customerName: 'Blessing E.',
      rating: 5,
      quote: 'Super reliable! Having all my monthly wellness essentials under one roof in Nigeria makes life so much easier.',
      location: 'Abuja, FCT',
      verifiedPurchase: true,
    },
  ],
};

let auditLogsState: AuditLogEntry[] = [
  {
    id: 'log-1',
    admin_email: 'admin@thebloomingher.com',
    action: 'DISCOUNT_CREATED',
    resource: 'discounts',
    resource_id: 'disc-1',
    details: { code: 'BLOOM10', discount: '10%' },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'log-2',
    admin_email: 'admin@thebloomingher.com',
    action: 'STOCK_UPDATED',
    resource: 'products',
    resource_id: 'prod-electric-heating-pad',
    details: { old_stock: 40, new_stock: 65, reason: 'Restock shipment received' },
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'log-3',
    admin_email: 'admin@thebloomingher.com',
    action: 'SETTINGS_SAVED',
    resource: 'site_settings',
    details: { free_shipping_threshold: 40000 },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

let marketingCampaignsState: MarketingCampaign[] = [
  {
    id: 'camp-wellness-2026',
    name: 'September Wellness Care Celebration',
    slug: 'september-wellness-care',
    description: 'Empowering women across Nigeria with curated cycle comfort, organic herbal teas, and lifestyle essentials.',
    cover_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg',
    status: 'active',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2026-10-31T23:59:59Z',
    timezone: 'Africa/Lagos',
    banner_ids: ['banner-hero-1', 'banner-hero-2'],
    promotion_ids: ['promo-1'],
    coupon_ids: ['disc-1'],
    announcement_ids: ['ann-1'],
    featured_product_ids: [
      'prod-electric-heating-pad',
      'prod-womb-tea-herbal',
      'prod-organic-pant-liners',
    ],
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'camp-black-friday-2026',
    name: 'Black Friday Care Festival 2026',
    slug: 'black-friday-care-festival',
    description: 'Exclusive yearly flash deals, bundle gifts, and free nationwide delivery on all orders.',
    cover_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
    status: 'scheduled',
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-11-30T23:59:59Z',
    timezone: 'Africa/Lagos',
    banner_ids: [],
    promotion_ids: [],
    coupon_ids: [],
    announcement_ids: [],
    featured_product_ids: [],
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
  },
];

let marketingEventsState: MarketingEvent[] = [
  {
    id: 'evt-bloomingher-wellness-day-2026',
    name: 'BloomingHer Wellness Day 2026',
    slug: 'bloomingher-wellness-day-2026',
    description: 'Join us for an empowering day of holistic feminine wellness, pelvic health masterclasses with certified gynecologists, cycle nutrition workshops, and intimate self-care goodie bags.',
    tagline: 'Empower Your Cycle • Connect With Bloomies • Rejuvenate Your Spirit',
    desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg',
    mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
    event_date: '2026-10-18',
    start_time: '10:00 AM',
    end_time: '4:00 PM WAT',
    location: 'Radisson Blu Hotel, Victoria Island, Lagos & Virtual Livestream',
    is_online: false,
    registration_url: 'https://thebloomingher.com/events/bloomingher-wellness-day-2026',
    cta_text: 'Reserve Your Seat',
    is_featured: true,
    status: 'upcoming',
    max_attendees: 150,
    registered_count: 84,
    created_at: '2026-09-10T12:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'evt-cycle-care-masterclass',
    name: 'Mastering Your Cycle: Virtual Workshop',
    slug: 'cycle-care-masterclass',
    description: 'A 2-hour interactive virtual session answering your most intimate questions on hormonal balance, managing cramp pain naturally, and selecting the right menstrual hygiene products.',
    tagline: 'Understanding Your Body, Hormones & Natural Rhythms',
    desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg',
    mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg',
    event_date: '2026-11-08',
    start_time: '6:00 PM',
    end_time: '8:00 PM WAT',
    location: 'Live on Zoom (Interactive Q&A)',
    is_online: true,
    registration_url: 'https://thebloomingher.com/events/cycle-care-masterclass',
    cta_text: 'Join Free Workshop',
    is_featured: false,
    status: 'upcoming',
    max_attendees: 300,
    registered_count: 142,
    created_at: '2026-09-12T14:00:00Z',
    updated_at: '2026-09-12T14:00:00Z',
  },
];

let marketingBannersState: MarketingBanner[] = [
  {
    id: 'banner-hero-1',
    internal_name: 'Hero 1 - Menstrual Cramp Relief Belt Advert',
    title: 'Soothe Severe Period Cramp Pain in',
    highlighted_title: 'Under 10 Minutes.',
    subtitle: 'Doctor-tested rechargeable menstrual heating belt with soothing vibration and targeted thermal warmth. Same-day Lagos dispatch!',
    badge_text: 'BEST SELLER • FAST ACTING DRUG-FREE COMFORT',
    banner_type: 'promotion',
    placement: 'homepage_hero',
    primary_cta: {
      text: 'Order Cramp Relief Belt',
      destinationType: 'product',
      destinationId: 'prod-electric-heating-pad',
      url: '/products/electric-heating-pad-vibration-cramp-relief-belt',
    },
    secondary_cta: {
      text: 'Explore Pain Relief',
      destinationType: 'collection',
      destinationId: 'pain-relief-comfort',
      url: '/categories/pain-relief-comfort',
    },
    desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg',
    mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789398339/jybtyu4rrytv7mgoksvl.jpg',
    alt_text: 'Electric Menstrual Cramp Relief Heating Belt',
    theme_color: 'plum',
    priority_order: 1,
    status: 'active',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    timezone: 'Africa/Lagos',
    clicks_count: 450,
    impressions_count: 3200,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'banner-hero-2',
    internal_name: 'Hero 2 - Welcome 10% Discount Promotion',
    title: 'Upgrade Your Monthly Cycle Care with',
    highlighted_title: '10% Off Your Entire Order.',
    subtitle: 'Stock up on premium organic cotton pads, medical-grade menstrual cups, womb wellness teas, and hygiene essentials. Free Lagos doorstep delivery over ₦40,000.',
    badge_text: 'LIMITED TIME PROMO • USE CODE BLOOM10',
    banner_type: 'promotion',
    placement: 'homepage_hero',
    primary_cta: {
      text: 'Claim 10% Discount',
      destinationType: 'custom_page',
      url: '/products',
    },
    secondary_cta: {
      text: 'View Under ₦10k Finds',
      destinationType: 'collection',
      url: '/collections/under-10k-finds',
    },
    desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg',
    mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg',
    alt_text: 'TheBloomingHer Care & Wellness Products Special Offer',
    theme_color: 'wellness',
    priority_order: 2,
    status: 'active',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    timezone: 'Africa/Lagos',
    clicks_count: 310,
    impressions_count: 2400,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'banner-hero-3',
    internal_name: 'Hero 3 - Bloomie Care Complete Kits Advert',
    title: 'Complete Intimate Hygiene & Herbal Comfort,',
    highlighted_title: 'Delivered Discreetly.',
    subtitle: 'pH-balanced intimate washes, herbal womb wellness tea blends, and breathable liners crafted to keep you feeling fresh, confident, and balanced all month long.',
    badge_text: 'ALL-IN-ONE CARE • CURATED SELF-CARE KITS',
    banner_type: 'promotion',
    placement: 'homepage_hero',
    primary_cta: {
      text: 'Shop Care Bundles',
      destinationType: 'collection',
      destinationId: 'bloomie-care',
      url: '/collections/bloomie-care',
    },
    secondary_cta: {
      text: 'Browse Intimate Hygiene',
      destinationType: 'collection',
      destinationId: 'intimate-hygiene',
      url: '/categories/intimate-hygiene',
    },
    desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
    mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg',
    alt_text: 'Bloomie Care Complete Intimate Hygiene Bundles',
    theme_color: 'plum',
    priority_order: 3,
    status: 'active',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    timezone: 'Africa/Lagos',
    clicks_count: 280,
    impressions_count: 2100,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'banner-hero-4',
    internal_name: 'Hero 4 - Nigeria Trusted Nationwide Delivery',
    title: 'Confidence, Dignity & Peace of Mind for',
    highlighted_title: 'Every Blooming Woman.',
    subtitle: 'Over 10,000+ satisfied women across Lagos, Abuja, Port Harcourt and nationwide. 100% discrete plain packaging, same-day dispatch & friendly WhatsApp concierge.',
    badge_text: 'NIGERIA\'S #1 TRUSTED FEMININE CARE',
    banner_type: 'promotion',
    placement: 'homepage_hero',
    primary_cta: {
      text: 'Explore All Essentials',
      destinationType: 'custom_page',
      url: '/products',
    },
    secondary_cta: {
      text: 'Chat on WhatsApp',
      destinationType: 'custom_page',
      url: 'https://wa.me/2348149725817',
    },
    desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg',
    mobile_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg',
    alt_text: 'TheBloomingHer Nationwide Delivery & Trust',
    theme_color: 'wellness',
    priority_order: 4,
    status: 'active',
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    timezone: 'Africa/Lagos',
    clicks_count: 360,
    impressions_count: 2900,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

let marketingAnnouncementsState: MarketingAnnouncement[] = [
  {
    id: 'ann-1',
    message: 'Free Lagos Doorstep Delivery on orders above ₦40,000 | Same-Day Lagos Dispatch Available',
    link_url: '/products',
    link_text: 'Shop Now',
    placement: 'top_bar',
    bg_color: '#FAF5F7',
    text_color: '#B85D88',
    is_closable: true,
    status: 'active',
    priority_order: 1,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'ann-2',
    message: '🌸 Early-Bird Registration open for BloomingHer Wellness Day 2026!',
    link_url: '/events/bloomingher-wellness-day-2026',
    link_text: 'Get Tickets',
    placement: 'homepage_section',
    bg_color: '#F0FDF4',
    text_color: '#166534',
    is_closable: false,
    status: 'active',
    priority_order: 2,
    created_at: '2026-09-10T00:00:00Z',
    updated_at: '2026-09-10T00:00:00Z',
  },
];

let mediaAssetsState: MediaAsset[] = [
  {
    id: 'media-1',
    filename: 'hero-lifestyle-desk.jpg',
    url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332389/yfwwycybz8ozvxvsgepe.jpg',
    file_size_bytes: 245000,
    mime_type: 'image/jpeg',
    width: 1440,
    height: 900,
    alt_text: 'Lifestyle wellness products flatlay',
    tags: ['hero', 'lifestyle', 'products'],
    folder: 'banners',
    uploaded_by: 'admin@thebloomingher.com',
    created_at: '2026-09-01T10:00:00Z',
    used_in: [{ resource_type: 'banner', resource_id: 'banner-hero-1', resource_name: 'Hero Slide 1' }],
  },
  {
    id: 'media-2',
    filename: 'wellness-day-promo.jpg',
    url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg',
    file_size_bytes: 310000,
    mime_type: 'image/jpeg',
    width: 1200,
    height: 800,
    alt_text: 'BloomingHer Wellness Day Event',
    tags: ['events', 'banner', 'wellness'],
    folder: 'events',
    uploaded_by: 'admin@thebloomingher.com',
    created_at: '2026-09-10T12:00:00Z',
    used_in: [
      { resource_type: 'banner', resource_id: 'banner-hero-2', resource_name: 'Hero Slide 2' },
      { resource_type: 'event', resource_id: 'evt-bloomingher-wellness-day-2026', resource_name: 'BloomingHer Wellness Day' },
    ],
  },
  {
    id: 'media-3',
    filename: 'cramp-heating-belt.jpg',
    url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789336361/sbeli1b41qdlryawrrzn.jpg',
    file_size_bytes: 198000,
    mime_type: 'image/jpeg',
    width: 1000,
    height: 1000,
    alt_text: 'Thermal Heating Cramp Belt',
    tags: ['products', 'cramp-relief', 'hero'],
    folder: 'products',
    uploaded_by: 'admin@thebloomingher.com',
    created_at: '2026-09-01T12:00:00Z',
    used_in: [{ resource_type: 'banner', resource_id: 'banner-hero-3', resource_name: 'Hero Slide 3' }],
  },
  {
    id: 'media-4',
    filename: 'cycle-boxes-curated.jpg',
    url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789380343/l6qlplskuhasrnxqrb4v.jpg',
    file_size_bytes: 280000,
    mime_type: 'image/jpeg',
    width: 1200,
    height: 800,
    alt_text: 'Curated Period Care Box',
    tags: ['bloomie-care', 'boxes', 'promotions'],
    folder: 'banners',
    uploaded_by: 'admin@thebloomingher.com',
    created_at: '2026-09-05T14:00:00Z',
    used_in: [],
  },
  {
    id: 'media-5',
    filename: 'brand-logo.jpg',
    url: '/images/logo.jpg',
    file_size_bytes: 65000,
    mime_type: 'image/jpeg',
    width: 400,
    height: 400,
    alt_text: 'TheBloomingHer Official Logo',
    tags: ['logo', 'branding'],
    folder: 'branding',
    uploaded_by: 'admin@thebloomingher.com',
    created_at: '2026-01-01T00:00:00Z',
    used_in: [],
  },
];

// Helper to determine real-time dynamic schedule status
function computeDynamicStatus(
  status: string,
  startDate?: string,
  endDate?: string
): 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived' {
  if (status === 'draft' || status === 'paused' || status === 'archived') {
    return status as any;
  }
  const now = Date.now();
  if (startDate) {
    const startMs = new Date(startDate).getTime();
    if (now < startMs) return 'scheduled';
  }
  if (endDate) {
    const endMs = new Date(endDate).getTime();
    if (now > endMs) return 'expired';
  }
  return 'active';
}

export const cmsStore = {
  // Products
  getProducts: () => productsState.filter(p => !deletedProductIdsState.has(p.id) && !deletedProductIdsState.has(p.slug)),
  getProductById: (id: string) => {
    if (deletedProductIdsState.has(id)) return undefined;
    return productsState.find(p => (p.id === id || p.slug === id) && !deletedProductIdsState.has(p.id) && !deletedProductIdsState.has(p.slug));
  },
  isProductDeleted: (id: string) => deletedProductIdsState.has(id),
  saveProduct: (product: Product) => {
    deletedProductIdsState.delete(product.id);
    if (product.slug) deletedProductIdsState.delete(product.slug);
    const idx = productsState.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      productsState[idx] = product;
    } else {
      productsState.unshift(product);
    }
    cmsStore.addAuditLog('admin@thebloomingher.com', idx >= 0 ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED', 'products', product.id, { name: product.name });
    return product;
  },
  deleteProduct: (idOrSlug: string) => {
    deletedProductIdsState.add(idOrSlug);
    const p = productsState.find(prod => prod.id === idOrSlug || prod.slug === idOrSlug);
    if (p) {
      deletedProductIdsState.add(p.id);
      if (p.slug) deletedProductIdsState.add(p.slug);
      productsState = productsState.filter(prod => prod.id !== p.id && prod.slug !== p.slug);
      cmsStore.addAuditLog('admin@thebloomingher.com', 'PRODUCT_DELETED', 'products', p.id, { name: p.name });
    } else {
      productsState = productsState.filter(prod => prod.id !== idOrSlug && prod.slug !== idOrSlug);
    }
    return true;
  },
  updateProductStock: (id: string, newStock: number) => {
    const product = productsState.find(p => p.id === id);
    if (product) {
      const oldStock = product.stock_quantity;
      product.stock_quantity = Math.max(0, newStock);
      cmsStore.addAuditLog('admin@thebloomingher.com', 'STOCK_UPDATED', 'products', id, {
        product: product.name,
        old_stock: oldStock,
        new_stock: product.stock_quantity,
      });
      return product;
    }
    return null;
  },

  // Categories
  getCategories: () => categoriesState,
  saveCategory: (category: Category) => {
    const idx = categoriesState.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      categoriesState[idx] = category;
    } else {
      categoriesState.push(category);
    }
    cmsStore.addAuditLog('admin@thebloomingher.com', idx >= 0 ? 'CATEGORY_UPDATED' : 'CATEGORY_CREATED', 'categories', category.id, { name: category.name });
    return category;
  },
  deleteCategory: (id: string) => {
    const idx = categoriesState.findIndex(c => c.id === id || c.slug === id);
    if (idx >= 0) {
      const cat = categoriesState[idx];
      categoriesState.splice(idx, 1);
      cmsStore.addAuditLog('admin@thebloomingher.com', 'CATEGORY_DELETED', 'categories', cat.id, { name: cat.name });
      return true;
    }
    return false;
  },

  // Discounts
  getDiscounts: () => discountsState,
  saveDiscount: (discount: DiscountCoupon) => {
    const idx = discountsState.findIndex(d => d.id === discount.id);
    if (idx >= 0) {
      discountsState[idx] = discount;
    } else {
      discountsState.unshift(discount);
    }
    cmsStore.addAuditLog('admin@thebloomingher.com', idx >= 0 ? 'DISCOUNT_UPDATED' : 'DISCOUNT_CREATED', 'discounts', discount.id, { code: discount.code });
    return discount;
  },
  deleteDiscount: (id: string) => {
    discountsState = discountsState.filter(d => d.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'DISCOUNT_DELETED', 'discounts', id);
    return true;
  },

  // Promotions
  getPromotions: () => promotionsState,
  savePromotion: (promo: PromotionCampaign) => {
    const idx = promotionsState.findIndex(p => p.id === promo.id);
    if (idx >= 0) {
      promotionsState[idx] = promo;
    } else {
      promotionsState.unshift(promo);
    }
    cmsStore.addAuditLog('admin@thebloomingher.com', idx >= 0 ? 'PROMOTION_UPDATED' : 'PROMOTION_CREATED', 'promotions', promo.id, { title: promo.title });
    return promo;
  },
  deletePromotion: (id: string) => {
    promotionsState = promotionsState.filter(p => p.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'PROMOTION_DELETED', 'promotions', id);
    return true;
  },

  // Reviews
  getReviews: () => reviewsState,
  addReview: (review: ProductReview) => {
    reviewsState.unshift(review);
    return review;
  },
  deleteReview: (id: string) => {
    reviewsState = reviewsState.filter(r => r.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'REVIEW_DELETED', 'reviews', id);
    return true;
  },

  // Site Settings & Homepage
  getSiteSettings: () => siteSettingsState,
  updateSiteSettings: (settings: Partial<SiteSettings>) => {
    siteSettingsState = { ...siteSettingsState, ...settings };
    cmsStore.addAuditLog('admin@thebloomingher.com', 'SETTINGS_UPDATED', 'site_settings', undefined, settings);
    return siteSettingsState;
  },
  getHomepageConfig: () => homepageConfigState,
  updateHomepageConfig: (config: Partial<HomepageConfig>) => {
    homepageConfigState = { ...homepageConfigState, ...config };
    cmsStore.addAuditLog('admin@thebloomingher.com', 'HOMEPAGE_CMS_UPDATED', 'homepage_config', undefined, config);
    return homepageConfigState;
  },

  // Recommendation Relationships & Analytics Events
  getRelationships: () => relationshipsState,
  getRelationshipsForProduct: (productId: string) =>
    relationshipsState.filter(r => r.source_product_id === productId && r.is_active),
  saveRelationship: (rel: Partial<ProductRelationship>) => {
    const existingIdx = relationshipsState.findIndex(r => r.id === rel.id);
    const relationship: ProductRelationship = {
      id: rel.id || `rel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source_product_id: rel.source_product_id!,
      target_product_id: rel.target_product_id!,
      relationship_type: rel.relationship_type || 'related',
      priority_weight: rel.priority_weight || 50,
      is_active: rel.is_active !== undefined ? rel.is_active : true,
      is_manual: rel.is_manual !== undefined ? rel.is_manual : true,
      created_at: rel.created_at || new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      relationshipsState[existingIdx] = relationship;
    } else {
      relationshipsState.unshift(relationship);
    }
    cmsStore.addAuditLog('admin@thebloomingher.com', existingIdx >= 0 ? 'RELATIONSHIP_UPDATED' : 'RELATIONSHIP_CREATED', 'product_relationships', relationship.id, {
      source: relationship.source_product_id,
      target: relationship.target_product_id,
      type: relationship.relationship_type,
    });
    return relationship;
  },
  deleteRelationship: (id: string) => {
    relationshipsState = relationshipsState.filter(r => r.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'RELATIONSHIP_DELETED', 'product_relationships', id);
    return true;
  },

  // Co-Purchases
  getCoPurchases: () => coPurchasesState,
  recalculateCoPurchasesFromOrders: (orders: any[]) => {
    const pairCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.items && order.items.length > 1) {
        const itemIds = order.items.map((i: any) => i.product_id);
        for (let i = 0; i < itemIds.length; i++) {
          for (let j = i + 1; j < itemIds.length; j++) {
            const key1 = `${itemIds[i]}::${itemIds[j]}`;
            const key2 = `${itemIds[j]}::${itemIds[i]}`;
            pairCounts[key1] = (pairCounts[key1] || 0) + 1;
            pairCounts[key2] = (pairCounts[key2] || 0) + 1;
          }
        }
      }
    });

    const newCoPurchases: CoPurchaseAssociation[] = [];
    Object.entries(pairCounts).forEach(([pairKey, count]) => {
      const [sourceId, targetId] = pairKey.split('::');
      const sourceProd = productsState.find(p => p.id === sourceId);
      const targetProd = productsState.find(p => p.id === targetId);
      newCoPurchases.push({
        source_product_id: sourceId,
        source_product_name: sourceProd?.name,
        target_product_id: targetId,
        target_product_name: targetProd?.name,
        frequency: count,
        confidence_score: Math.min(1.0, count / Math.max(1, orders.length * 0.5)),
        last_occurred_at: new Date().toISOString(),
      });
    });

    coPurchasesState = newCoPurchases;
    return coPurchasesState;
  },

  // Analytics Events
  getAnalyticsEvents: () => eventsState,
  trackEvent: (eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>) => {
    const event: AnalyticsEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    eventsState.unshift(event);
    if (eventsState.length > 1000) {
      eventsState.pop();
    }
    return event;
  },
  getRecommendationMetrics: (): RecommendationMetrics => {
    const impressions = eventsState.filter(e => e.event_type === 'recommendation_impression').length;
    const clicks = eventsState.filter(e => e.event_type === 'recommendation_click').length;
    const cartAdds = eventsState.filter(e => e.event_type === 'recommendation_add_to_cart').length;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conv = clicks > 0 ? (cartAdds / clicks) * 100 : 0;

    return {
      totalImpressions: impressions || 142, // baseline demo signals
      totalClicks: clicks || 38,
      clickThroughRate: impressions > 0 ? Number(ctr.toFixed(1)) : 26.7,
      totalCartAdds: cartAdds || 19,
      conversionRate: clicks > 0 ? Number(conv.toFixed(1)) : 50.0,
    };
  },

  // Audit Logs
  getAuditLogs: () => auditLogsState,
  addAuditLog: (adminEmail: string, action: string, resource: string, resourceId?: string, details?: Record<string, any>) => {
    const log: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      admin_email: adminEmail,
      action,
      resource,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    };
    auditLogsState.unshift(log);
    if (auditLogsState.length > 200) {
      auditLogsState.pop();
    }
  },

  // ==========================================
  // ROLES & PERMISSIONS
  // ==========================================
  getPermissions: (): PermissionDefinition[] => {
    return SYSTEM_PERMISSIONS;
  },

  getRoles: (requestingRole?: string): Role[] => {
    const isSuperAdmin = requestingRole === 'super_admin' || requestingRole === 'role-super-admin';
    // Guarantee DEFAULT_ROLES (Administrator and Staff) are present in rolesState
    DEFAULT_ROLES.forEach(defRole => {
      const idx = rolesState.findIndex(r => r.id === defRole.id || r.slug === defRole.slug);
      if (idx === -1) {
        rolesState.push(JSON.parse(JSON.stringify(defRole)));
      } else {
        rolesState[idx] = {
          ...rolesState[idx],
          ...defRole,
        };
      }
    });

    let list = rolesState;
    if (!isSuperAdmin && requestingRole !== undefined) {
      list = list.filter(r => r.slug !== 'super_admin' && r.id !== 'role-super-admin');
    }
    return list.map(role => {
      const userCount = adminsState.filter(a => a.role_id === role.id || a.role === role.slug).length;
      return {
        ...role,
        user_count: userCount,
      };
    });
  },

  getRoleById: (id: string): Role | undefined => {
    const role = rolesState.find(r => r.id === id || r.slug === id);
    if (!role) return undefined;
    const userCount = adminsState.filter(a => a.role_id === role.id || a.role === role.slug).length;
    return {
      ...role,
      user_count: userCount,
    };
  },

  saveRole: (roleData: Partial<Role> & { name: string; permissions: string[] }): Role => {
    const isNew = !roleData.id;
    const slug = roleData.slug || roleData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    const id = roleData.id || `role-${slug}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const existingIdx = rolesState.findIndex(r => r.id === id || (roleData.id && r.id === roleData.id));

    // Preserve is_system flag if already set
    const isSystem = existingIdx >= 0 ? rolesState[existingIdx].is_system : (roleData.is_system || false);

    const updatedRole: Role = {
      id,
      name: roleData.name,
      slug,
      description: roleData.description || '',
      permissions: roleData.permissions,
      is_system: isSystem,
      created_at: existingIdx >= 0 ? rolesState[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      rolesState[existingIdx] = updatedRole;
      cmsStore.addAuditLog('admin@thebloomingher.com', 'ROLE_UPDATED', 'roles', id, { name: updatedRole.name, permissions_count: updatedRole.permissions.length });
    } else {
      rolesState.push(updatedRole);
      cmsStore.addAuditLog('admin@thebloomingher.com', 'ROLE_CREATED', 'roles', id, { name: updatedRole.name, permissions_count: updatedRole.permissions.length });
    }

    return updatedRole;
  },

  deleteRole: (id: string): { success: boolean; error?: string } => {
    const role = rolesState.find(r => r.id === id || r.slug === id);
    if (!role) {
      return { success: false, error: 'Role not found.' };
    }

    if (role.is_system || role.slug === 'super_admin' || role.slug === 'admin') {
      return { success: false, error: 'System default roles cannot be deleted.' };
    }

    // Check if any admin is currently assigned to this role
    const assignedAdmins = adminsState.filter(a => a.role_id === role.id || a.role === role.slug);
    if (assignedAdmins.length > 0) {
      return {
        success: false,
        error: `Cannot delete role '${role.name}' because it is currently assigned to ${assignedAdmins.length} administrator(s). Reassign them first.`,
      };
    }

    rolesState = rolesState.filter(r => r.id !== role.id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'ROLE_DELETED', 'roles', role.id, { name: role.name });
    return { success: true };
  },

  // ==========================================
  // ADMINISTRATORS MANAGEMENT
  // ==========================================
  getAdmins: (filters?: {
    role?: string;
    status?: string;
    search?: string;
    requestingAdminId?: string;
    requestingEmail?: string;
    requestingRole?: string;
  }): AdminUser[] => {
    const isSuperAdmin = filters?.requestingRole === 'super_admin' || filters?.requestingRole === 'role-super-admin';

    let list = adminsState.map(admin => {
      // Resolve permissions from role if not explicitly provided
      const matchedRole = DEFAULT_ROLES.find(r => r.id === admin.role_id || r.slug === admin.role) || rolesState.find(r => r.id === admin.role_id || r.slug === admin.role);
      const permissions = matchedRole ? matchedRole.permissions : (admin.permissions || []);

      const { password_hash, ...safeAdmin } = admin;
      return {
        ...safeAdmin,
        role_name: matchedRole ? matchedRole.name : (admin.role_name || admin.role),
        permissions,
      };
    });

    // 1. Exclude the currently authenticated user (they manage their own profile separately)
    if (filters?.requestingAdminId) {
      list = list.filter(a => a.id !== filters.requestingAdminId);
    }
    if (filters?.requestingEmail) {
      list = list.filter(a => a.email.toLowerCase() !== filters.requestingEmail?.toLowerCase());
    }

    // 2. If logged in as regular Admin (not Superadmin), completely exclude Superadmin records
    if (!isSuperAdmin && filters?.requestingRole !== undefined) {
      list = list.filter(
        a => a.role !== 'super_admin' && a.role_id !== 'role-super-admin' && !a.role_name?.toLowerCase().includes('super')
      );
    }

    // 3. Filter by role (if an admin requests 'super_admin' and is not superadmin, the above filter already stripped it)
    if (filters?.role && filters.role !== 'all') {
      list = list.filter(a => a.role_id === filters.role || a.role === filters.role);
    }

    // 4. Filter by status
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(a => a.status === filters.status);
    }

    // 5. Search query (search across full_name, email, role_name, phone)
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        a =>
          a.full_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.role_name.toLowerCase().includes(q) ||
          (a.phone && a.phone.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getAdminById: (id: string): AdminRecord | undefined => {
    const admin = adminsState.find(a => a.id === id);
    if (!admin) return undefined;
    const matchedRole = DEFAULT_ROLES.find(r => r.id === admin.role_id || r.slug === admin.role) || rolesState.find(r => r.id === admin.role_id || r.slug === admin.role);
    return {
      ...admin,
      role_name: matchedRole ? matchedRole.name : admin.role_name,
      permissions: matchedRole ? matchedRole.permissions : (admin.permissions || []),
    };
  },

  getAdminByEmail: (email: string): AdminRecord | undefined => {
    const admin = adminsState.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) return undefined;
    const matchedRole = DEFAULT_ROLES.find(r => r.id === admin.role_id || r.slug === admin.role) || rolesState.find(r => r.id === admin.role_id || r.slug === admin.role);
    return {
      ...admin,
      role_name: matchedRole ? matchedRole.name : admin.role_name,
      permissions: matchedRole ? matchedRole.permissions : (admin.permissions || []),
    };
  },

  createAdmin: (data: {
    first_name: string;
    last_name: string;
    email: string;
    role_id?: string;
    role?: string;
    phone?: string;
    custom_password?: string;
  }): { admin: AdminUser; adminRecord: AdminRecord; temporaryPassword: string } => {
    const cleanEmail = data.email.toLowerCase().trim();
    const cleanFirst = data.first_name.trim();
    const cleanLast = data.last_name.trim();
    const fullName = `${cleanFirst} ${cleanLast}`.trim();

    // Generate initial temporary password: ${firstname.toLowerCase()}123
    const temporaryPassword = data.custom_password || `${cleanFirst.toLowerCase().replace(/[^a-z0-9]/g, '')}123`;
    const passwordHash = bcrypt.hashSync(temporaryPassword, 10);

    // Find role
    const matchedRole =
      DEFAULT_ROLES.find(
        r => r.id === data.role_id || r.slug === data.role || r.id === data.role || r.slug === data.role_id
      ) ||
      rolesState.find(
        r => r.id === data.role_id || r.slug === data.role || r.id === data.role || r.slug === data.role_id
      ) ||
      DEFAULT_ROLES.find(r => r.id === 'role-staff') ||
      DEFAULT_ROLES[1];

    const newAdmin: AdminRecord = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      first_name: cleanFirst,
      last_name: cleanLast,
      full_name: fullName,
      role_id: matchedRole.id,
      role_name: matchedRole.name,
      role: matchedRole.slug,
      permissions: matchedRole.permissions,
      status: 'active',
      is_active: true,
      must_change_password: true, // Force password change on first login
      phone: data.phone?.trim() || '',
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };

    adminsState.push(newAdmin);

    cmsStore.addAuditLog('admin@thebloomingher.com', 'ADMIN_CREATED', 'administrators', newAdmin.id, {
      email: newAdmin.email,
      role: matchedRole.name,
      name: newAdmin.full_name,
    });

    const { password_hash, ...safeAdmin } = newAdmin;
    return { admin: safeAdmin, adminRecord: newAdmin, temporaryPassword };
  },

  syncAdminsFromDb: (dbAdmins: any[]) => {
    dbAdmins.forEach(dbA => {
      const idx = adminsState.findIndex(a => a.id === dbA.id || a.email.toLowerCase() === dbA.email.toLowerCase());
      const matchedRole =
        DEFAULT_ROLES.find(r => r.id === dbA.role_id || r.slug === dbA.role_slug || r.slug === dbA.role) ||
        rolesState.find(r => r.id === dbA.role_id || r.slug === dbA.role_slug);
      const adminRecord: AdminRecord = {
        id: dbA.id,
        email: dbA.email.toLowerCase(),
        password_hash: dbA.password_hash,
        first_name: dbA.first_name,
        last_name: dbA.last_name,
        full_name: dbA.full_name || `${dbA.first_name} ${dbA.last_name}`.trim(),
        role_id: matchedRole ? matchedRole.id : dbA.role_id,
        role_name: matchedRole ? matchedRole.name : (dbA.role_name || 'Staff'),
        role: matchedRole ? matchedRole.slug : (dbA.role_slug || 'staff'),
        permissions: matchedRole ? matchedRole.permissions : [],
        status: dbA.status || 'active',
        is_active: dbA.is_active !== undefined ? dbA.is_active : dbA.status === 'active',
        must_change_password: dbA.must_change_password || false,
        phone: dbA.phone || '',
        avatar_url: dbA.avatar_url,
        last_login_at: dbA.last_login || dbA.last_login_at,
        created_at: dbA.created_at || new Date().toISOString(),
        updated_at: dbA.updated_at || new Date().toISOString(),
      };

      if (idx >= 0) {
        adminsState[idx] = {
          ...adminsState[idx],
          ...adminRecord,
        };
      } else {
        adminsState.push(adminRecord);
      }
    });
  },

  updateAdmin: (id: string, updates: Partial<AdminRecord>): { success: boolean; admin?: AdminUser; error?: string } => {
    const adminIndex = adminsState.findIndex(a => a.id === id);
    if (adminIndex === -1) {
      return { success: false, error: 'Administrator not found.' };
    }

    const currentAdmin = adminsState[adminIndex];

    // Protect last active super admin from being demoted
    if (currentAdmin.role === 'super_admin' || currentAdmin.role_id === 'role-super-admin') {
      if (updates.role && updates.role !== 'super_admin' && updates.role_id !== 'role-super-admin') {
        const otherSuperAdmins = adminsState.filter(
          a => a.id !== id && (a.role === 'super_admin' || a.role_id === 'role-super-admin') && a.status === 'active'
        );
        if (otherSuperAdmins.length === 0) {
          return {
            success: false,
            error: 'Cannot demote the only remaining active Super Administrator.',
          };
        }
      }
    }

    let matchedRole = undefined;
    if (updates.role_id || updates.role) {
      matchedRole = rolesState.find(r => r.id === updates.role_id || r.slug === updates.role || r.id === updates.role);
    }

    const updatedAdmin: AdminRecord = {
      ...currentAdmin,
      ...updates,
      first_name: updates.first_name ? updates.first_name.trim() : currentAdmin.first_name,
      last_name: updates.last_name ? updates.last_name.trim() : currentAdmin.last_name,
      full_name: (updates.first_name || updates.last_name)
        ? `${(updates.first_name || currentAdmin.first_name).trim()} ${(updates.last_name || currentAdmin.last_name).trim()}`.trim()
        : (updates.full_name || currentAdmin.full_name),
      role_id: matchedRole ? matchedRole.id : currentAdmin.role_id,
      role_name: matchedRole ? matchedRole.name : currentAdmin.role_name,
      role: matchedRole ? matchedRole.slug : currentAdmin.role,
      permissions: matchedRole ? matchedRole.permissions : (updates.permissions || currentAdmin.permissions),
      updated_at: new Date().toISOString(),
    };

    adminsState[adminIndex] = updatedAdmin;

    cmsStore.addAuditLog('admin@thebloomingher.com', 'ADMIN_UPDATED', 'administrators', id, {
      name: updatedAdmin.full_name,
      email: updatedAdmin.email,
      role: updatedAdmin.role_name,
    });

    const { password_hash, ...safeAdmin } = updatedAdmin;
    return { success: true, admin: safeAdmin };
  },

  setAdminStatus: (id: string, status: AdminStatus): { success: boolean; admin?: AdminUser; error?: string } => {
    const admin = adminsState.find(a => a.id === id);
    if (!admin) {
      return { success: false, error: 'Administrator not found.' };
    }

    // Protect last super admin
    if ((admin.role === 'super_admin' || admin.role_id === 'role-super-admin') && status !== 'active') {
      const otherSuperAdmins = adminsState.filter(
        a => a.id !== id && (a.role === 'super_admin' || a.role_id === 'role-super-admin') && a.status === 'active'
      );
      if (otherSuperAdmins.length === 0) {
        return {
          success: false,
          error: 'Cannot deactivate or suspend the only remaining active Super Administrator.',
        };
      }
    }

    admin.status = status;
    admin.is_active = status === 'active';
    admin.updated_at = new Date().toISOString();

    const action = status === 'active' ? 'ADMIN_ACTIVATED' : (status === 'suspended' ? 'ADMIN_SUSPENDED' : 'ADMIN_DEACTIVATED');
    cmsStore.addAuditLog('admin@thebloomingher.com', action, 'administrators', id, { status, email: admin.email });

    const { password_hash, ...safeAdmin } = admin;
    return { success: true, admin: safeAdmin };
  },

  resetAdminPassword: (id: string): { success: boolean; temporaryPassword?: string; error?: string } => {
    const admin = adminsState.find(a => a.id === id);
    if (!admin) {
      return { success: false, error: 'Administrator not found.' };
    }

    const firstName = admin.first_name || admin.full_name.split(' ')[0] || 'admin';
    const temporaryPassword = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}123`;
    admin.password_hash = bcrypt.hashSync(temporaryPassword, 10);
    admin.must_change_password = true; // Force password change
    admin.updated_at = new Date().toISOString();

    cmsStore.addAuditLog('admin@thebloomingher.com', 'ADMIN_PASSWORD_RESET', 'administrators', id, { email: admin.email });

    return { success: true, temporaryPassword };
  },

  changeAdminPassword: (id: string, newPassword: string): { success: boolean; error?: string } => {
    const admin = adminsState.find(a => a.id === id);
    if (!admin) {
      return { success: false, error: 'Administrator not found.' };
    }

    admin.password_hash = bcrypt.hashSync(newPassword, 10);
    admin.must_change_password = false; // Successfully cleared
    admin.updated_at = new Date().toISOString();

    cmsStore.addAuditLog(admin.email, 'ADMIN_PASSWORD_CHANGED', 'administrators', id, { email: admin.email });

    return { success: true };
  },

  deleteAdmin: (id: string): { success: boolean; error?: string } => {
    const admin = adminsState.find(a => a.id === id);
    if (!admin) {
      return { success: false, error: 'Administrator not found.' };
    }

    if (admin.role === 'super_admin' || admin.role_id === 'role-super-admin') {
      const otherSuperAdmins = adminsState.filter(
        a => a.id !== id && (a.role === 'super_admin' || a.role_id === 'role-super-admin') && a.status === 'active'
      );
      if (otherSuperAdmins.length === 0) {
        return {
          success: false,
          error: 'Cannot delete the only remaining active Super Administrator.',
        };
      }
    }

    adminsState = adminsState.filter(a => a.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'ADMIN_DELETED', 'administrators', id, { email: admin.email, name: admin.full_name });

    return { success: true };
  },

  updateAdminLastLogin: (id: string) => {
    const admin = adminsState.find(a => a.id === id);
    if (admin) {
      admin.last_login_at = new Date().toISOString();
    }
  },

  // Customers Authentication
  getCustomerByEmail: (email: string): CustomerRecord | undefined => {
    return customersState.find(c => c.email.toLowerCase() === email.toLowerCase());
  },
  getCustomerById: (id: string): CustomerRecord | undefined => {
    return customersState.find(c => c.id === id);
  },
  createCustomer: (data: Omit<CustomerRecord, 'id' | 'created_at'> & { id?: string }): CustomerRecord => {
    if (data.id) {
      const existingById = customersState.find(c => c.id === data.id);
      if (existingById) return existingById;
    }
    const existingByEmail = customersState.find(c => c.email.toLowerCase() === data.email.toLowerCase());
    if (existingByEmail) return existingByEmail;

    const newCustomer: CustomerRecord = {
      ...data,
      id: data.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    customersState.push(newCustomer);
    return newCustomer;
  },
  updateCustomerLastLogin: (id: string) => {
    const customer = customersState.find(c => c.id === id);
    if (customer) {
      customer.last_login_at = new Date().toISOString();
    }
  },
  updateCustomerProfile: (id: string, updates: Partial<CustomerUser>): CustomerUser | undefined => {
    const customer = customersState.find(c => c.id === id);
    if (!customer) return undefined;

    if (updates.first_name) customer.first_name = updates.first_name;
    if (updates.last_name) customer.last_name = updates.last_name;
    if (updates.phone !== undefined) customer.phone = updates.phone;
    if (updates.delivery_address) customer.delivery_address = updates.delivery_address;

    return customer;
  },

  // ==========================================
  // MARKETING BANNERS
  // ==========================================
  getBanners: (filters?: BannerFilterOptions): MarketingBanner[] => {
    let list = marketingBannersState.map(b => ({
      ...b,
      status: computeDynamicStatus(b.status, b.start_date, b.end_date),
    }));

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(b => b.status === filters.status);
    }
    if (filters?.type && filters.type !== 'all') {
      list = list.filter(b => b.banner_type === filters.type);
    }
    if (filters?.placement && filters.placement !== 'all') {
      list = list.filter(b => b.placement === filters.placement);
    }
    if (filters?.campaign_id) {
      list = list.filter(b => b.campaign_id === filters.campaign_id);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        b =>
          b.internal_name.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.subtitle?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.priority_order - b.priority_order);
  },

  getActiveBanners: (placement?: BannerPlacement): MarketingBanner[] => {
    let list = marketingBannersState
      .map(b => ({
        ...b,
        status: computeDynamicStatus(b.status, b.start_date, b.end_date),
      }))
      .filter(b => b.status === 'active');

    if (placement) {
      list = list.filter(b => b.placement === placement);
    }

    return list.sort((a, b) => a.priority_order - b.priority_order);
  },

  getBannerById: (id: string): MarketingBanner | undefined => {
    const b = marketingBannersState.find(banner => banner.id === id);
    if (!b) return undefined;
    return {
      ...b,
      status: computeDynamicStatus(b.status, b.start_date, b.end_date),
    };
  },

  saveBanner: (bannerData: Partial<MarketingBanner> & { title: string; desktop_image_url: string }): MarketingBanner => {
    const isNew = !bannerData.id;
    const bannerId = bannerData.id || `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const banner: MarketingBanner = {
      id: bannerId,
      internal_name: bannerData.internal_name || bannerData.title,
      title: bannerData.title,
      highlighted_title: bannerData.highlighted_title || '',
      subtitle: bannerData.subtitle || '',
      badge_text: bannerData.badge_text || '',
      banner_type: bannerData.banner_type || 'promotion',
      placement: bannerData.placement || 'homepage_hero',
      primary_cta: bannerData.primary_cta || {
        text: 'Shop Now',
        destinationType: 'custom_page',
        url: '/shop',
      },
      secondary_cta: bannerData.secondary_cta,
      desktop_image_url: bannerData.desktop_image_url,
      mobile_image_url: bannerData.mobile_image_url || bannerData.desktop_image_url,
      tablet_image_url: bannerData.tablet_image_url,
      alt_text: bannerData.alt_text || bannerData.title,
      theme_color: bannerData.theme_color || 'plum',
      campaign_id: bannerData.campaign_id,
      promotion_id: bannerData.promotion_id,
      event_id: bannerData.event_id,
      priority_order: bannerData.priority_order !== undefined ? bannerData.priority_order : marketingBannersState.length + 1,
      status: bannerData.status || 'draft',
      start_date: bannerData.start_date,
      end_date: bannerData.end_date,
      timezone: bannerData.timezone || 'Africa/Lagos',
      clicks_count: bannerData.clicks_count || 0,
      impressions_count: bannerData.impressions_count || 0,
      created_at: bannerData.created_at || now,
      updated_at: now,
    };

    const idx = marketingBannersState.findIndex(b => b.id === banner.id);
    if (idx >= 0) {
      marketingBannersState[idx] = banner;
    } else {
      marketingBannersState.push(banner);
    }

    cmsStore.addAuditLog('admin@thebloomingher.com', isNew ? 'BANNER_CREATED' : 'BANNER_UPDATED', 'marketing_banners', banner.id, { name: banner.internal_name });
    return banner;
  },

  deleteBanner: (id: string): boolean => {
    const banner = marketingBannersState.find(b => b.id === id);
    if (!banner) return false;
    marketingBannersState = marketingBannersState.filter(b => b.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'BANNER_DELETED', 'marketing_banners', id, { name: banner.internal_name });
    return true;
  },

  duplicateBanner: (id: string): MarketingBanner | null => {
    const original = marketingBannersState.find(b => b.id === id);
    if (!original) return null;

    const duplicated: MarketingBanner = {
      ...JSON.parse(JSON.stringify(original)),
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      internal_name: `${original.internal_name} (Copy)`,
      status: 'draft',
      priority_order: marketingBannersState.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clicks_count: 0,
      impressions_count: 0,
    };

    marketingBannersState.push(duplicated);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'BANNER_DUPLICATED', 'marketing_banners', duplicated.id, { from: original.id });
    return duplicated;
  },

  reorderBanners: (orderedIds: string[]): MarketingBanner[] => {
    orderedIds.forEach((id, index) => {
      const banner = marketingBannersState.find(b => b.id === id);
      if (banner) {
        banner.priority_order = index + 1;
        banner.updated_at = new Date().toISOString();
      }
    });
    return cmsStore.getBanners();
  },

  // ==========================================
  // MARKETING CAMPAIGNS
  // ==========================================
  getCampaigns: (): MarketingCampaign[] => {
    return marketingCampaignsState.map(c => ({
      ...c,
      status: computeDynamicStatus(c.status, c.start_date, c.end_date) as any,
    }));
  },

  getCampaignById: (id: string): MarketingCampaign | undefined => {
    const c = marketingCampaignsState.find(camp => camp.id === id);
    if (!c) return undefined;
    return {
      ...c,
      status: computeDynamicStatus(c.status, c.start_date, c.end_date) as any,
    };
  },

  saveCampaign: (data: Partial<MarketingCampaign> & { name: string }): MarketingCampaign => {
    const isNew = !data.id;
    const id = data.id || `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const campaign: MarketingCampaign = {
      id,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: data.description || '',
      cover_image_url: data.cover_image_url,
      status: data.status || 'draft',
      start_date: data.start_date,
      end_date: data.end_date,
      timezone: data.timezone || 'Africa/Lagos',
      banner_ids: data.banner_ids || [],
      promotion_ids: data.promotion_ids || [],
      coupon_ids: data.coupon_ids || [],
      announcement_ids: data.announcement_ids || [],
      featured_product_ids: data.featured_product_ids || [],
      created_at: data.created_at || now,
      updated_at: now,
    };

    const idx = marketingCampaignsState.findIndex(c => c.id === id);
    if (idx >= 0) {
      marketingCampaignsState[idx] = campaign;
    } else {
      marketingCampaignsState.unshift(campaign);
    }

    cmsStore.addAuditLog('admin@thebloomingher.com', isNew ? 'CAMPAIGN_CREATED' : 'CAMPAIGN_UPDATED', 'marketing_campaigns', campaign.id, { name: campaign.name });
    return campaign;
  },

  deleteCampaign: (id: string): boolean => {
    marketingCampaignsState = marketingCampaignsState.filter(c => c.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'CAMPAIGN_DELETED', 'marketing_campaigns', id);
    return true;
  },

  // ==========================================
  // MARKETING EVENTS
  // ==========================================
  getEvents: (): MarketingEvent[] => {
    return marketingEventsState;
  },

  getActiveEvents: (): MarketingEvent[] => {
    return marketingEventsState.filter(e => e.status === 'upcoming' || e.status === 'ongoing');
  },

  getEventById: (id: string): MarketingEvent | undefined => {
    return marketingEventsState.find(e => e.id === id);
  },

  getEventBySlug: (slug: string): MarketingEvent | undefined => {
    return marketingEventsState.find(e => e.slug === slug);
  },

  saveEvent: (data: Partial<MarketingEvent> & { name: string; event_date: string; desktop_image_url: string }): MarketingEvent => {
    const isNew = !data.id;
    const id = data.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const event: MarketingEvent = {
      id,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: data.description || '',
      tagline: data.tagline,
      desktop_image_url: data.desktop_image_url,
      mobile_image_url: data.mobile_image_url || data.desktop_image_url,
      event_date: data.event_date,
      start_time: data.start_time || '10:00 AM',
      end_time: data.end_time,
      location: data.location || 'Lagos, Nigeria',
      is_online: data.is_online !== undefined ? data.is_online : false,
      registration_url: data.registration_url || `/events/${data.slug || id}`,
      cta_text: data.cta_text || 'Register Now',
      is_featured: data.is_featured !== undefined ? data.is_featured : false,
      status: data.status || 'upcoming',
      max_attendees: data.max_attendees,
      registered_count: data.registered_count || 0,
      created_at: data.created_at || now,
      updated_at: now,
    };

    const idx = marketingEventsState.findIndex(e => e.id === id);
    if (idx >= 0) {
      marketingEventsState[idx] = event;
    } else {
      marketingEventsState.unshift(event);
    }

    cmsStore.addAuditLog('admin@thebloomingher.com', isNew ? 'EVENT_CREATED' : 'EVENT_UPDATED', 'marketing_events', event.id, { name: event.name });
    return event;
  },

  deleteEvent: (id: string): boolean => {
    marketingEventsState = marketingEventsState.filter(e => e.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'EVENT_DELETED', 'marketing_events', id);
    return true;
  },

  // ==========================================
  // MARKETING ANNOUNCEMENTS
  // ==========================================
  getAnnouncements: (): MarketingAnnouncement[] => {
    return marketingAnnouncementsState.map(a => ({
      ...a,
      status: computeDynamicStatus(a.status, a.start_date, a.end_date),
    })).sort((a, b) => a.priority_order - b.priority_order);
  },

  getActiveAnnouncements: (placement?: string): MarketingAnnouncement[] => {
    let list = marketingAnnouncementsState
      .map(a => ({
        ...a,
        status: computeDynamicStatus(a.status, a.start_date, a.end_date),
      }))
      .filter(a => a.status === 'active');

    if (placement) {
      list = list.filter(a => a.placement === placement);
    }
    return list.sort((a, b) => a.priority_order - b.priority_order);
  },

  saveAnnouncement: (data: Partial<MarketingAnnouncement> & { message: string }): MarketingAnnouncement => {
    const isNew = !data.id;
    const id = data.id || `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const announcement: MarketingAnnouncement = {
      id,
      message: data.message,
      link_url: data.link_url,
      link_text: data.link_text,
      placement: data.placement || 'top_bar',
      bg_color: data.bg_color || '#FAF5F7',
      text_color: data.text_color || '#B85D88',
      is_closable: data.is_closable !== undefined ? data.is_closable : true,
      status: data.status || 'active',
      start_date: data.start_date,
      end_date: data.end_date,
      priority_order: data.priority_order !== undefined ? data.priority_order : marketingAnnouncementsState.length + 1,
      created_at: data.created_at || now,
      updated_at: now,
    };

    const idx = marketingAnnouncementsState.findIndex(a => a.id === id);
    if (idx >= 0) {
      marketingAnnouncementsState[idx] = announcement;
    } else {
      marketingAnnouncementsState.push(announcement);
    }

    cmsStore.addAuditLog('admin@thebloomingher.com', isNew ? 'ANNOUNCEMENT_CREATED' : 'ANNOUNCEMENT_UPDATED', 'marketing_announcements', announcement.id);
    return announcement;
  },

  deleteAnnouncement: (id: string): boolean => {
    marketingAnnouncementsState = marketingAnnouncementsState.filter(a => a.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'ANNOUNCEMENT_DELETED', 'marketing_announcements', id);
    return true;
  },

  // ==========================================
  // MEDIA LIBRARY
  // ==========================================
  getMediaAssets: (search?: string, folder?: string): MediaAsset[] => {
    let list = mediaAssetsState;
    if (folder && folder !== 'all') {
      list = list.filter(m => m.folder === folder);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        m =>
          m.filename.toLowerCase().includes(q) ||
          m.alt_text?.toLowerCase().includes(q) ||
          m.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  },

  saveMediaAsset: (data: Partial<MediaAsset> & { filename: string; url: string }): MediaAsset => {
    const id = data.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const asset: MediaAsset = {
      id,
      filename: data.filename,
      url: data.url,
      file_size_bytes: data.file_size_bytes || 150000,
      mime_type: data.mime_type || 'image/jpeg',
      width: data.width || 1200,
      height: data.height || 800,
      alt_text: data.alt_text || data.filename,
      tags: data.tags || ['general'],
      folder: data.folder || 'general',
      uploaded_by: data.uploaded_by || 'admin@thebloomingher.com',
      created_at: data.created_at || new Date().toISOString(),
      used_in: data.used_in || [],
    };

    const idx = mediaAssetsState.findIndex(m => m.id === id);
    if (idx >= 0) {
      mediaAssetsState[idx] = asset;
    } else {
      mediaAssetsState.unshift(asset);
    }
    return asset;
  },

  deleteMediaAsset: (id: string): boolean => {
    mediaAssetsState = mediaAssetsState.filter(m => m.id !== id);
    cmsStore.addAuditLog('admin@thebloomingher.com', 'MEDIA_DELETED', 'media_assets', id);
    return true;
  },

  getMediaUsage: (mediaUrl: string) => {
    const usedIn: { type: string; name: string; id: string }[] = [];
    // Check in banners
    marketingBannersState.forEach(b => {
      if (b.desktop_image_url === mediaUrl || b.mobile_image_url === mediaUrl) {
        usedIn.push({ type: 'Banner', name: b.internal_name, id: b.id });
      }
    });
    // Check in events
    marketingEventsState.forEach(e => {
      if (e.desktop_image_url === mediaUrl || e.mobile_image_url === mediaUrl) {
        usedIn.push({ type: 'Event', name: e.name, id: e.id });
      }
    });
    // Check in products
    productsState.forEach(p => {
      if (p.images && p.images.some(img => typeof img === 'string' ? img === mediaUrl : img.url === mediaUrl)) {
        usedIn.push({ type: 'Product', name: p.name, id: p.id });
      }
    });
    return usedIn;
  },
};

