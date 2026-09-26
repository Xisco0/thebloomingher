import { orderRepository } from '@/repositories';
import { Order, CreateOrderDTO, PaymentStatus } from '@/types';

export class OrderService {
  private generateOrderNumber(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TBH-${yyyy}${mm}${dd}-${randomSuffix}`;
  }

  async createOrder(data: CreateOrderDTO): Promise<Order> {
    const orderNumber = this.generateOrderNumber();
    return orderRepository.createOrder(data, orderNumber);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return orderRepository.getOrderById(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return orderRepository.getOrderByNumber(orderNumber);
  }

  async getOrderByPaystackReference(reference: string): Promise<Order | null> {
    return orderRepository.getOrderByPaystackReference(reference);
  }

  async completePayment(orderId: string, reference: string): Promise<Order> {
    return orderRepository.updatePaymentStatus(orderId, 'paid', reference);
  }
}

export const orderService = new OrderService();
