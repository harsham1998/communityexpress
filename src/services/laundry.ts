import ApiService from './api';

export interface LaundryVendor {
  id: string;
  vendor_id: string;
  business_name: string;
  description?: string;
  pickup_time_start: string;
  pickup_time_end: string;
  delivery_time_hours: number;
  minimum_order_amount: number;
  pickup_charge: number;
  delivery_charge: number;
  service_areas: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LaundryItem {
  id: string;
  laundry_vendor_id: string;
  name: string;
  description?: string;
  category: string;
  price_per_piece: number;
  estimated_time_hours: number;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LaundryOrderItem {
  laundry_item_id: string;
  quantity: number;
  special_instructions?: string;
}

export interface LaundryOrderItemResponse {
  id: string;
  laundry_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  item_name: string;
  item_category: string;
  item_description?: string;
}

export interface LaundryOrder {
  id: string;
  user_id: string;
  laundry_vendor_id: string;
  order_number: string;
  pickup_address: string;
  pickup_date: string;
  pickup_time_slot: string;
  pickup_instructions?: string;
  delivery_address?: string;
  estimated_delivery_date?: string;
  estimated_delivery_time?: string;
  delivery_instructions?: string;
  status: string;
  subtotal: number;
  pickup_charge: number;
  delivery_charge: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  confirmed_at?: string;
  picked_up_at?: string;
  ready_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  items: LaundryOrderItemResponse[];
  vendor_business_name: string;
  user_name: string;
  user_phone?: string;
}

export interface LaundryOrderCreate {
  laundry_vendor_id: string;
  pickup_address: string;
  pickup_date: string;
  pickup_time_slot: string;
  pickup_instructions?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  items: LaundryOrderItem[];
}

export interface LaundryPaymentRequest {
  payment_method: string;
  payment_reference?: string;
}

export interface LaundryPaymentResponse {
  success: boolean;
  payment_reference: string;
  message: string;
}

export interface LaundryUserStats {
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  total_spent: number;
  favorite_vendor?: string;
  recent_orders: LaundryOrder[];
}

export class LaundryService {
  // Vendor-related methods
  static async getAllLaundryVendors(communityId?: string): Promise<LaundryVendor[]> {
    const params = new URLSearchParams();
    if (communityId) params.append('community_id', communityId);
    
    const response = await ApiService.get<LaundryVendor[]>(`/laundry/vendors?${params.toString()}`);
    if (response.error) throw new Error(response.error);
    return response.data || [];
  }

  static async getLaundryVendor(vendorId: string): Promise<LaundryVendor> {
    const response = await ApiService.get<LaundryVendor>(`/laundry/vendors/${vendorId}`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  // Items-related methods
  static async getLaundryItems(vendorId: string, category?: string, isAvailable?: boolean): Promise<LaundryItem[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (isAvailable !== undefined) params.append('is_available', isAvailable.toString());
    
    const response = await ApiService.get<LaundryItem[]>(`/laundry/vendors/${vendorId}/items?${params.toString()}`);
    if (response.error) throw new Error(response.error);
    return response.data || [];
  }

  static async createLaundryItem(vendorId: string, itemData: Omit<LaundryItem, 'id' | 'laundry_vendor_id' | 'is_available' | 'created_at' | 'updated_at'>): Promise<LaundryItem> {
    const response = await ApiService.post<LaundryItem>(`/laundry/vendors/${vendorId}/items`, itemData);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  static async updateLaundryItem(vendorId: string, itemId: string, itemData: Partial<Omit<LaundryItem, 'id' | 'laundry_vendor_id' | 'created_at' | 'updated_at'>>): Promise<LaundryItem> {
    const response = await ApiService.put<LaundryItem>(`/laundry/vendors/${vendorId}/items/${itemId}`, itemData);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  static async deleteLaundryItem(vendorId: string, itemId: string): Promise<{message: string}> {
    const response = await ApiService.delete<{message: string}>(`/laundry/vendors/${vendorId}/items/${itemId}`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  // Order-related methods
  static async createLaundryOrder(orderData: LaundryOrderCreate): Promise<LaundryOrder> {
    const response = await ApiService.post<LaundryOrder>('/laundry/orders', orderData);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  static async getLaundryOrders(status?: string): Promise<LaundryOrder[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await ApiService.get<LaundryOrder[]>(`/laundry/orders?${params.toString()}`);
    if (response.error) throw new Error(response.error);
    return response.data || [];
  }

  static async getLaundryOrder(orderId: string): Promise<LaundryOrder> {
    const response = await ApiService.get<LaundryOrder>(`/laundry/orders/${orderId}`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  static async updateLaundryOrder(orderId: string, updateData: Partial<LaundryOrder>): Promise<LaundryOrder> {
    const response = await ApiService.put<LaundryOrder>(`/laundry/orders/${orderId}`, updateData);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  // Payment-related methods
  static async processPayment(orderId: string, paymentData: LaundryPaymentRequest): Promise<LaundryPaymentResponse> {
    const response = await ApiService.post<LaundryPaymentResponse>(`/laundry/orders/${orderId}/payment`, paymentData);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  // Dashboard-related methods
  static async getUserStats(): Promise<LaundryUserStats> {
    const response = await ApiService.get<LaundryUserStats>('/laundry/users/dashboard');
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  static async getVendorDashboard(vendorId: string): Promise<any> {
    const response = await ApiService.get<any>(`/laundry/vendors/${vendorId}/dashboard`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  }

  // Utility methods
  static getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'pending': '#f59e0b',     // yellow
      'confirmed': '#3b82f6',   // blue
      'picked_up': '#8b5cf6',   // purple
      'in_process': '#f97316',  // orange
      'ready': '#10b981',       // green
      'delivered': '#059669',   // emerald
      'cancelled': '#ef4444',   // red
    };
    return statusColors[status] || '#6b7280'; // gray as default
  }

  static getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'picked_up': 'Picked Up',
      'in_process': 'In Process',
      'ready': 'Ready for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusTexts[status] || status;
  }

  static getPaymentStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'pending': '#f59e0b',     // yellow
      'paid': '#059669',        // emerald
      'failed': '#ef4444',      // red
      'refunded': '#6b7280',    // gray
    };
    return statusColors[status] || '#6b7280';
  }

  static formatPrice(price: number): string {
    return `₹${price.toFixed(2)}`;
  }

  static getTimeSlots(): string[] {
    return [
      '08:00-10:00',
      '10:00-12:00',
      '12:00-14:00',
      '14:00-16:00',
      '16:00-18:00',
      '18:00-20:00'
    ];
  }

  static getItemCategories(): { value: string; label: string }[] {
    return [
      { value: 'wash', label: 'Wash Only' },
      { value: 'dry_clean', label: 'Dry Clean' },
      { value: 'iron', label: 'Iron Only' },
      { value: 'wash_iron', label: 'Wash & Iron' },
      { value: 'wash_fold', label: 'Wash & Fold' },
      { value: 'steam', label: 'Steam Clean' },
      { value: 'starch', label: 'Starch & Iron' },
    ];
  }
}