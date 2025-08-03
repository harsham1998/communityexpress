import { API_CONFIG, buildApiUrl } from '../config/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = buildApiUrl(endpoint);
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      const token = await this.getAuthToken();
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  private static async getAuthToken(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Authentication endpoints
  static async login(email: string, password: string) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    community_id?: string;
    apartment_number?: string;
  }) {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async getCurrentUser() {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  static async joinCommunity(communityCode: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.AUTH.JOIN_COMMUNITY}?community_code=${communityCode}`, {
      method: 'POST',
    });
  }

  // Vendor endpoints
  static async getVendors() {
    return this.request(API_CONFIG.ENDPOINTS.VENDORS);
  }

  static async getVendor(vendorId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.VENDORS}/${vendorId}`);
  }

  // Product endpoints
  static async getProductsByVendor(vendorId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PRODUCTS}/vendor/${vendorId}`);
  }

  static async getProduct(productId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${productId}`);
  }

  // Order endpoints
  static async getOrders() {
    return this.request(API_CONFIG.ENDPOINTS.ORDERS);
  }

  static async createOrder(orderData: any) {
    return this.request(API_CONFIG.ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async getOrder(orderId: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`);
  }

  static async updateOrderStatus(orderId: string, status: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ new_status: status }),
    });
  }

  // Payment endpoints
  static async getPayments() {
    return this.request(API_CONFIG.ENDPOINTS.PAYMENTS);
  }

  static async createPayment(paymentData: any) {
    return this.request(API_CONFIG.ENDPOINTS.PAYMENTS, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }
}

export default ApiService;