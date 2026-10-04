export type FAQCategory = 'delivery' | 'products' | 'orders' | 'returns' | 'general';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  is_active: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FAQInput {
  question: string;
  answer: string;
  category?: FAQCategory;
  is_active?: boolean;
  is_published?: boolean;
  sort_order?: number;
}
