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
import { FAQ, FAQCategory } from '@/types/faq.types';

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

      if (!error && Array.isArray(data)) {
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

      if (!error && Array.isArray(data)) {
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
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_banners')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          internal_name: data.internal_name || data.title || 'Banner',
          title: data.title,
          highlighted_title: data.highlighted_title || undefined,
          subtitle: data.subtitle || undefined,
          badge_text: data.badge_text || undefined,
          banner_type: data.banner_type || 'custom',
          placement: data.placement || 'homepage_hero',
          primary_cta: typeof data.primary_cta === 'string' ? JSON.parse(data.primary_cta) : (data.primary_cta || { text: 'Shop Now', destinationType: 'collection', url: '/shop' }),
          secondary_cta: typeof data.secondary_cta === 'string' ? JSON.parse(data.secondary_cta) : (data.secondary_cta || undefined),
          desktop_image_url: data.desktop_image_url,
          mobile_image_url: data.mobile_image_url || undefined,
          alt_text: data.alt_text || data.title || '',
          priority_order: Number(data.priority_order || 1),
          status: data.status || 'active',
          timezone: data.timezone || 'Africa/Lagos',
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
      if (!error && !data) {
        return undefined;
      }
    } catch (err) {
      console.warn('Supabase getBannerById error, using fallback:', err);
    }
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

      if (!error && Array.isArray(data)) {
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

      if (!error && Array.isArray(data)) {
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
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_events')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          tagline: data.tagline || undefined,
          event_date: data.event_date,
          start_time: data.start_time,
          end_time: data.end_time || undefined,
          location: data.location,
          is_online: Boolean(data.is_virtual || data.is_online),
          registration_url: data.registration_url || '',
          cta_text: data.cta_text || 'Register Now',
          desktop_image_url: data.desktop_image_url,
          mobile_image_url: data.mobile_image_url || undefined,
          status: data.status || 'upcoming',
          is_featured: Boolean(data.is_featured),
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
      if (!error && !data) {
        return undefined;
      }
    } catch (err) {
      console.warn('Supabase getEventById error, using fallback:', err);
    }
    const events = await this.getEvents();
    return events.find(e => e.id === id || e.slug === id);
  }

  async getEventBySlug(slug: string): Promise<MarketingEvent | undefined> {
    return this.getEventById(slug);
  }

  // Announcements
  async getAnnouncements(): Promise<MarketingAnnouncement[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
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

      if (!error && Array.isArray(data)) {
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

  // FAQs
  async getFaqs(options?: { publicOnly?: boolean; category?: string; search?: string }): Promise<FAQ[]> {
    try {
      let query = supabaseAdmin.from('faqs').select('*');

      if (options?.publicOnly) {
        query = query.eq('is_active', true).eq('is_published', true);
      }

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (!error && Array.isArray(data)) {
        let results: FAQ[] = data.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          category: f.category || 'general',
          is_active: Boolean(f.is_active),
          is_published: Boolean(f.is_published),
          sort_order: Number(f.sort_order || 0),
          created_at: f.created_at,
          updated_at: f.updated_at,
        }));

        if (options?.search) {
          const s = options.search.toLowerCase();
          results = results.filter(
            f => f.question.toLowerCase().includes(s) || f.answer.toLowerCase().includes(s)
          );
        }

        return results;
      }
    } catch (err) {
      console.warn('Supabase getFaqs error, using fallback:', err);
    }

    return cmsStore.getFaqs(options);
  }

  async getPublicFaqs(category?: string): Promise<FAQ[]> {
    return this.getFaqs({ publicOnly: true, category });
  }

  async getFaqById(id: string): Promise<FAQ | undefined> {
    try {
      const { data, error } = await supabaseAdmin
        .from('faqs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          question: data.question,
          answer: data.answer,
          category: data.category || 'general',
          is_active: Boolean(data.is_active),
          is_published: Boolean(data.is_published),
          sort_order: Number(data.sort_order || 0),
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Supabase getFaqById error, using fallback:', err);
    }

    return cmsStore.getFaqById(id);
  }
}

export const cmsService = new CMSService();

