import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  MarketingBanner,
  MarketingCampaign,
  MarketingEvent,
  MarketingAnnouncement,
  MediaAsset,
  BannerPlacement,
  BannerFilterOptions,
} from '@/types/marketing-cms.types';
import { HomepageConfig } from '@/types/cms.types';

export class CMSService {
  async getHomepageConfig(): Promise<HomepageConfig> {
    return cmsStore.getHomepageConfig();
  }

  // Banners
  async getBanners(filters?: BannerFilterOptions): Promise<MarketingBanner[]> {
    try {
      let query = supabaseAdmin.from('marketing_banners').select('*');

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.placement && filters.placement !== 'all') {
        query = query.eq('placement', filters.placement);
      }
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('banner_type', filters.type);
      }

      const { data, error } = await query.order('priority_order', { ascending: true });

      if (!error && data && data.length > 0) {
        let results = data.map((b: any) => ({
          id: b.id,
          internal_name: b.internal_name || b.title || 'Banner',
          title: b.title,
          highlighted_title: b.highlighted_title || undefined,
          subtitle: b.subtitle || undefined,
          badge_text: b.badge_text || undefined,
          banner_type: b.banner_type || 'custom',
          placement: b.placement || 'homepage_hero',
          primary_cta: typeof b.primary_cta === 'string' ? JSON.parse(b.primary_cta) : (b.primary_cta || { text: 'Shop Now', destinationType: 'collection', url: '/shop' }),
          secondary_cta: typeof b.secondary_cta === 'string' ? JSON.parse(b.secondary_cta) : (b.secondary_cta || undefined),
          desktop_image_url: b.desktop_image_url,
          mobile_image_url: b.mobile_image_url || undefined,
          alt_text: b.alt_text || b.title || '',
          priority_order: Number(b.priority_order || 1),
          status: b.status || 'active',
          timezone: b.timezone || 'Africa/Lagos',
          created_at: b.created_at,
          updated_at: b.updated_at,
        }));

        if (filters?.search) {
          const s = filters.search.toLowerCase();
          results = results.filter((b: MarketingBanner) =>
            b.internal_name.toLowerCase().includes(s) ||
            b.title.toLowerCase().includes(s) ||
            (b.subtitle && b.subtitle.toLowerCase().includes(s))
          );
        }

        return results;
      }
    } catch (err) {
      console.warn('Supabase getBanners error, using fallback:', err);
    }

    return cmsStore.getBanners(filters);
  }

  async getActiveBanners(placement?: BannerPlacement): Promise<MarketingBanner[]> {
    try {
      let query = supabaseAdmin.from('marketing_banners').select('*').eq('status', 'active');

      if (placement) {
        query = query.eq('placement', placement);
      }

      const { data, error } = await query.order('priority_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          internal_name: b.internal_name || b.title || 'Banner',
          title: b.title,
          highlighted_title: b.highlighted_title || undefined,
          subtitle: b.subtitle || undefined,
          badge_text: b.badge_text || undefined,
          banner_type: b.banner_type || 'custom',
          placement: b.placement || 'homepage_hero',
          primary_cta: typeof b.primary_cta === 'string' ? JSON.parse(b.primary_cta) : (b.primary_cta || { text: 'Shop Now', destinationType: 'collection', url: '/shop' }),
          secondary_cta: typeof b.secondary_cta === 'string' ? JSON.parse(b.secondary_cta) : (b.secondary_cta || undefined),
          desktop_image_url: b.desktop_image_url,
          mobile_image_url: b.mobile_image_url || undefined,
          alt_text: b.alt_text || b.title || '',
          priority_order: Number(b.priority_order || 1),
          status: b.status || 'active',
          timezone: b.timezone || 'Africa/Lagos',
          created_at: b.created_at,
          updated_at: b.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase getActiveBanners error, using fallback:', err);
    }

    return cmsStore.getActiveBanners(placement);
  }

  async getBannerById(id: string): Promise<MarketingBanner | undefined> {
    const banners = await this.getBanners();
    return banners.find(b => b.id === id);
  }

  // Campaigns
  async getCampaigns(): Promise<MarketingCampaign[]> {
    return cmsStore.getCampaigns();
  }

  async getCampaignById(id: string): Promise<MarketingCampaign | undefined> {
    return cmsStore.getCampaignById(id);
  }

  // Events
  async getEvents(): Promise<MarketingEvent[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((e: any) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          description: e.description || '',
          tagline: e.tagline || undefined,
          event_date: e.event_date,
          start_time: e.start_time,
          end_time: e.end_time || undefined,
          location: e.location,
          is_online: Boolean(e.is_virtual || e.is_online),
          registration_url: e.registration_url || '',
          cta_text: e.cta_text || 'Register Now',
          desktop_image_url: e.desktop_image_url,
          mobile_image_url: e.mobile_image_url || undefined,
          status: e.status || 'upcoming',
          is_featured: Boolean(e.is_featured),
          created_at: e.created_at,
          updated_at: e.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase getEvents error, using fallback:', err);
    }

    return cmsStore.getEvents();
  }

  async getActiveEvents(): Promise<MarketingEvent[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_events')
        .select('*')
        .neq('status', 'cancelled')
        .order('event_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((e: any) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          description: e.description || '',
          tagline: e.tagline || undefined,
          event_date: e.event_date,
          start_time: e.start_time,
          end_time: e.end_time || undefined,
          location: e.location,
          is_online: Boolean(e.is_virtual || e.is_online),
          registration_url: e.registration_url || '',
          cta_text: e.cta_text || 'Register Now',
          desktop_image_url: e.desktop_image_url,
          mobile_image_url: e.mobile_image_url || undefined,
          status: e.status || 'upcoming',
          is_featured: Boolean(e.is_featured),
          created_at: e.created_at,
          updated_at: e.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase getActiveEvents error, using fallback:', err);
    }

    return cmsStore.getActiveEvents();
  }

  async getEventById(id: string): Promise<MarketingEvent | undefined> {
    const events = await this.getEvents();
    return events.find(e => e.id === id || e.slug === id);
  }

  async getEventBySlug(slug: string): Promise<MarketingEvent | undefined> {
    const events = await this.getEvents();
    return events.find(e => e.slug === slug || e.id === slug);
  }

  // Announcements
  async getAnnouncements(): Promise<MarketingAnnouncement[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          message: a.text || a.message || '',
          link_text: a.link_text || undefined,
          link_url: a.link_url || undefined,
          placement: (a.placement as any) || 'top_bar',
          is_closable: true,
          status: (a.status as any) || 'active',
          priority_order: 1,
          created_at: a.created_at,
          updated_at: a.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase getAnnouncements error, using fallback:', err);
    }

    return cmsStore.getAnnouncements();
  }

  async getActiveAnnouncements(placement?: string): Promise<MarketingAnnouncement[]> {
    try {
      let query = supabaseAdmin.from('marketing_announcements').select('*').eq('status', 'active');
      if (placement) {
        query = query.eq('placement', placement);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          message: a.text || a.message || '',
          link_text: a.link_text || undefined,
          link_url: a.link_url || undefined,
          placement: (a.placement as any) || 'top_bar',
          is_closable: true,
          status: (a.status as any) || 'active',
          priority_order: 1,
          created_at: a.created_at,
          updated_at: a.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase getActiveAnnouncements error, using fallback:', err);
    }

    return cmsStore.getActiveAnnouncements(placement);
  }

  // Media Library
  async getMediaAssets(search?: string, folder?: string): Promise<MediaAsset[]> {
    return cmsStore.getMediaAssets(search, folder);
  }

  async getMediaUsage(url: string) {
    return cmsStore.getMediaUsage(url);
  }
}

export const cmsService = new CMSService();

