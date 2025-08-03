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
      console.log('API Request:', url, options);
      
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = await this.getAuthToken();
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', responseText);
        return {
          error: `Invalid JSON response: ${responseText.substring(0, 100)}...`,
          status: response.status,
        };
      }

      if (!response.ok) {
        return {
          error: data.detail || data.message || 'Request failed',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error: any) {
      console.error('API Request Error:', error);
      
      if (error?.name === 'AbortError') {
        return {
          error: 'Request timeout - server may be starting up. Please try again in a moment.',
          status: 0,
        };
      }
      
      return {
        error: error instanceof Error ? error.message : 'Network error - please check your connection',
        status: 0,
      };
    }
  }

  private static async getAuthToken(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const token = await AsyncStorage.getItem('auth_token');
      console.log('🔑 Getting auth token:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token found');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Generic HTTP methods
  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
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