export type AnalyticsEventName =
  | 'product_view'
  | 'product_image_view'
  | 'product_variant_selected'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_quantity_changed'
  | 'cart_view'
  | 'buy_now'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'review_view'
  | 'related_product_click'
  | 'search_performed'
  | 'filter_applied'
  | 'begin_checkout'
  | 'checkout_contact_completed'
  | 'checkout_address_completed'
  | 'checkout_delivery_selected'
  | 'order_created';

export interface AnalyticsPayload {
  productId?: string;
  productName?: string;
  productPrice?: number;
  categoryName?: string;
  sku?: string;
  variantId?: string;
  variantTitle?: string;
  quantity?: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  imageIndex?: number;
  source?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface AnalyticsAdapter {
  track: (event: AnalyticsEventName, payload: AnalyticsPayload) => void;
}

class AnalyticsManager {
  private adapters: AnalyticsAdapter[] = [];

  constructor() {
    // Default console logger in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.adapters.push({
        track: (event, payload) => {
          console.debug(`[Analytics Event] ${event}:`, payload);
        },
      });
    }
  }

  public registerAdapter(adapter: AnalyticsAdapter) {
    this.adapters.push(adapter);
  }

  public track(event: AnalyticsEventName, payload: AnalyticsPayload = {}) {
    const enrichedPayload: AnalyticsPayload = {
      ...payload,
      timestamp: Date.now(),
    };

    this.adapters.forEach(adapter => {
      try {
        adapter.track(event, enrichedPayload);
      } catch (err) {
        console.warn(`Error in analytics adapter for event ${event}:`, err);
      }
    });

    // Custom browser DOM event for extensible third-party listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tbh_analytics', {
          detail: { event, payload: enrichedPayload },
        })
      );
    }
  }
}

export const analytics = new AnalyticsManager();
