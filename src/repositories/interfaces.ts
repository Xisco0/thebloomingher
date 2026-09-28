import {
  Product,
  Category,
  ProductFilterOptions,
  PaginatedResult,
  Order,
  CreateOrderDTO,
  PaymentStatus,
  OrderStatus,
  PaymentRecord,
  HomepageConfig,
  ProductReview,
  RecommendationRequest,
  RecommendedProduct,
  ProductRelationship,
  CoPurchaseAssociation,
  AnalyticsEvent,
  RecommendationMetrics
} from '@/types';

export interface IProductRepository {
  getProducts(filter?: ProductFilterOptions): Promise<PaginatedResult<Product>>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  getBestSellers(limit?: number): Promise<Product[]>;
  getUnder10k(limit?: number): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getProductReviews(productId: string): Promise<ProductReview[]>;
}

export interface ICategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
}

export interface IOrderRepository {
  createOrder(orderData: CreateOrderDTO, orderNumber: string): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  getOrderByReference(reference: string): Promise<Order | null>;
  getOrderByPaystackReference(reference: string): Promise<Order | null>;
  updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    reference?: string,
    channel?: string,
    paidAt?: string,
    paymentProvider?: string,
    transactionId?: string
  ): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  savePayment(payment: PaymentRecord): Promise<PaymentRecord>;
  getPaymentByReference(reference: string): Promise<PaymentRecord | null>;
}

export interface IRecommendationRepository {
  getRecommendations(request: RecommendationRequest): Promise<RecommendedProduct[]>;
  getRelatedProducts(productId: string, categoryId?: string, limit?: number): Promise<Product[]>;
  getFrequentlyBoughtTogether(productId: string): Promise<Product[]>;
  getCartUpsells(categoryIds: string[], limit?: number): Promise<Product[]>;
  getRecentlyViewed(productIds: string[], limit?: number): Promise<Product[]>;
  getProductRelationships(productId?: string): Promise<ProductRelationship[]>;
  saveProductRelationship(rel: Partial<ProductRelationship>): Promise<ProductRelationship>;
  deleteProductRelationship(id: string): Promise<boolean>;
  getCoPurchases(limit?: number): Promise<CoPurchaseAssociation[]>;
  trackEvent(eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent>;
  getRecommendationMetrics(): Promise<RecommendationMetrics>;
}

export interface ICMSRepository {
  getHomepageConfig(): Promise<HomepageConfig>;
}
