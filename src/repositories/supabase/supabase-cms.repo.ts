import { ICMSRepository } from '../interfaces';
import { HomepageConfig } from '@/types';
import catalogData from '@/lib/data/catalog.json';

export class SupabaseCMSRepository implements ICMSRepository {
  async getHomepageConfig(): Promise<HomepageConfig> {
    return catalogData.homepage_config as unknown as HomepageConfig;
  }
}
