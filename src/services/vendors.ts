import ApiService from './api';

export type VendorType = 'milk' | 'laundry' | 'food' | 'cleaning';

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  email: string;
  phone: string;
  address: string;
  community_id: string;
  community_name?: string;
  description: string;
  is_active: boolean;
  rating: number;
  total_orders: number;
  monthly_revenue: number;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface VendorStats {
  vendorId: string;
  vendorName: string;
  vendorType: VendorType;
  orderCount: number;
  revenue: number;
  rating: number;
  isActive: boolean;
}

export interface CreateVendorRequest {
  name: string;
  type: VendorType;
  email: string;
  phone: string;
  address: string;
  community_id: string;
  description: string;
}

export interface UpdateVendorRequest extends CreateVendorRequest {
  id: string;
}

export class VendorsService {
  static async getAllVendors(): Promise<Vendor[]> {
    try {
      const response = await ApiService.get<Vendor[]>('/vendors');
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  }

  static async getVendorById(id: string): Promise<Vendor> {
    try {
      const response = await ApiService.get<Vendor>(`/vendors/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  }

  static async getVendorsByCommunity(communityId: string): Promise<Vendor[]> {
    try {
      const response = await ApiService.get<Vendor[]>(`/vendors/community/${communityId}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vendors by community:', error);
      throw error;
    }
  }

  static async getVendorsByType(type: VendorType): Promise<Vendor[]> {
    try {
      const response = await ApiService.get(`/vendors/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendors by type:', error);
      throw error;
    }
  }

  static async createVendor(vendorData: CreateVendorRequest): Promise<Vendor> {
    try {
      const response = await ApiService.post<Vendor>('/vendors', vendorData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }

  static async updateVendor(vendorData: UpdateVendorRequest): Promise<Vendor> {
    try {
      const { id, ...data } = vendorData;
      const response = await ApiService.put<Vendor>(`/vendors/${id}`, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  }

  static async deleteVendor(id: string): Promise<void> {
    try {
      await ApiService.delete(`/vendors/${id}`);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }

  static async toggleVendorStatus(id: string, isActive: boolean): Promise<Vendor> {
    try {
      const response = await ApiService.patch<Vendor>(`/vendors/${id}/status`, {
        is_active: isActive
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error toggling vendor status:', error);
      throw error;
    }
  }

  static async getVendorStats(): Promise<VendorStats[]> {
    try {
      const response = await ApiService.get<VendorStats[]>('/vendors/stats');
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      throw error;
    }
  }

  static async searchVendors(query: string, type?: VendorType): Promise<Vendor[]> {
    try {
      let url = `/vendors/search?q=${encodeURIComponent(query)}`;
      if (type) {
        url += `&type=${type}`;
      }
      const response = await ApiService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error searching vendors:', error);
      throw error;
    }
  }

  static async updateVendorRating(id: string, rating: number): Promise<Vendor> {
    try {
      const response = await ApiService.patch(`/vendors/${id}/rating`, {
        rating
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vendor rating:', error);
      throw error;
    }
  }
}