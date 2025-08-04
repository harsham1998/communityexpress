import ApiService from './api';
import { API_CONFIG } from '../config/api';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_type: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address: string;
  delivery_instructions?: string;
  estimated_delivery: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface CreateOrderRequest {
  vendor_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  delivery_address: string;
  delivery_instructions?: string;
}

export class OrdersService {
  static async getUserOrders(): Promise<Order[]> {
    try {
      const response = await ApiService.get<Order[]>(`${API_CONFIG.ENDPOINTS.ORDERS}my-orders`);
      if (response.error) {
        return [];
      }
      return response.data || [];
    } catch (error) {
      // Return empty array silently to prevent app crashes
      return [];
    }
  }

  static async getOrderById(id: string): Promise<Order> {
    try {
      const response = await ApiService.get<Order>(`${API_CONFIG.ENDPOINTS.ORDERS}${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await ApiService.post<Order>(API_CONFIG.ENDPOINTS.ORDERS, orderData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  static async cancelOrder(id: string): Promise<Order> {
    try {
      const response = await ApiService.patch<Order>(`${API_CONFIG.ENDPOINTS.ORDERS}${id}/cancel`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  static async reorderItems(orderId: string): Promise<Order> {
    try {
      const response = await ApiService.post<Order>(`${API_CONFIG.ENDPOINTS.ORDERS}${orderId}/reorder`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      throw error;
    }
  }
}