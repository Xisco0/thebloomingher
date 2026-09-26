export type BannerStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived';

export type BannerType =
  | 'promotion'
  | 'product'
  | 'event'
  | 'announcement'
  | 'new_arrival'
  | 'seasonal_campaign'
  | 'custom';

export type BannerPlacement =
  | 'homepage_hero'
  | 'homepage_split_banners'
  | 'homepage_promo_strip'
  | 'product_listing_banner'
  | 'category_page_banner'
  | 'event_section'
  | 'announcement_bar'
  | 'footer_promo';

export type CTADestinationType =
  | 'product'
  | 'category'
  | 'collection'
  | 'promotion'
  | 'event'
  | 'custom_page'
  | 'external_url';

export interface SmartCTA {
  text: string;
  destinationType: CTADestinationType;
  destinationId?: string; // product ID, category slug, collection slug, event ID, etc.
  url: string; // resolved URL path e.g. /products/electric-heating-pad or https://...
  openInNewTab?: boolean;
}

export interface MarketingBanner {
  id: string;
  internal_name: string;
  title: string;
  highlighted_title?: string;
  subtitle?: string;
  badge_text?: string;
  banner_type: BannerType;
  placement: BannerPlacement;
  
  // CTAs
  primary_cta: SmartCTA;
  secondary_cta?: SmartCTA;

  // Media (Dedicated creative per device to prevent mobile cropping)
  desktop_image_url: string;
  mobile_image_url?: string;
  tablet_image_url?: string;
  alt_text: string;
  theme_color?: string; // e.g. 'plum', 'wellness', or hex

  // Associated entities
  campaign_id?: string;
  promotion_id?: string;
  event_id?: string;

  // Ordering & Priority
  priority_order: number; // 0, 1, 2, 3... higher or lower based on sort

  // Scheduling
  status: BannerStatus;
  start_date?: string; // ISO string
  end_date?: string; // ISO string
  timezone: string; // default 'Africa/Lagos'

  // Metadata
  created_at: string;
  updated_at: string;
  clicks_count?: number;
  impressions_count?: number;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

export interface MarketingCampaign {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_image_url?: string;
  status: CampaignStatus;
  start_date?: string;
  end_date?: string;
  timezone: string;

  // Associated Content IDs
  banner_ids: string[];
  promotion_ids: string[];
  coupon_ids: string[];
  announcement_ids: string[];
  featured_product_ids: string[];

  // Meta
  created_at: string;
  updated_at: string;
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'draft';

export interface MarketingEvent {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline?: string;
  desktop_image_url: string;
  mobile_image_url?: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // e.g. "10:00 AM"
  end_time?: string; // e.g. "4:00 PM"
  location: string; // e.g. "Radisson Blu, Victoria Island, Lagos & Online Livestream"
  is_online?: boolean;
  registration_url: string;
  cta_text: string;
  is_featured: boolean;
  status: EventStatus;
  max_attendees?: number;
  registered_count?: number;
  created_at: string;
  updated_at: string;
}

export type AnnouncementPlacement = 'top_bar' | 'homepage_section' | 'inline_banner' | 'modal_popup';

export interface MarketingAnnouncement {
  id: string;
  message: string;
  link_url?: string;
  link_text?: string;
  placement: AnnouncementPlacement;
  bg_color?: string; // Tailwind class or hex
  text_color?: string;
  is_closable: boolean;
  status: BannerStatus;
  start_date?: string;
  end_date?: string;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  file_size_bytes: number;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  tags: string[];
  folder?: string;
  uploaded_by?: string;
  created_at: string;
  used_in: {
    resource_type: 'banner' | 'event' | 'campaign' | 'promotion' | 'product' | 'category';
    resource_id: string;
    resource_name: string;
  }[];
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile' | 'visitor';

export interface BannerFilterOptions {
  search?: string;
  status?: BannerStatus | 'all';
  type?: BannerType | 'all';
  placement?: BannerPlacement | 'all';
  campaign_id?: string;
}
