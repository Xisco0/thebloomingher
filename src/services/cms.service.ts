import { cmsStore } from '@/lib/cms-store';
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
    return cmsStore.getBanners(filters);
  }

  async getActiveBanners(placement?: BannerPlacement): Promise<MarketingBanner[]> {
    return cmsStore.getActiveBanners(placement);
  }

  async getBannerById(id: string): Promise<MarketingBanner | undefined> {
    return cmsStore.getBannerById(id);
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
    return cmsStore.getEvents();
  }

  async getActiveEvents(): Promise<MarketingEvent[]> {
    return cmsStore.getActiveEvents();
  }

  async getEventById(id: string): Promise<MarketingEvent | undefined> {
    return cmsStore.getEventById(id) || cmsStore.getEventBySlug(id);
  }

  async getEventBySlug(slug: string): Promise<MarketingEvent | undefined> {
    return cmsStore.getEventBySlug(slug) || cmsStore.getEventById(slug);
  }

  // Announcements
  async getAnnouncements(): Promise<MarketingAnnouncement[]> {
    return cmsStore.getAnnouncements();
  }

  async getActiveAnnouncements(placement?: string): Promise<MarketingAnnouncement[]> {
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
