import ApiService from './api';
import { API_CONFIG } from '../config/api';

export interface Community {
  id: string;
  name: string;
  address: string;
  community_code: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityStats {
  communityId: string;
  communityName: string;
  vendorCount: number;
  userCount: number;
  orderCount: number;
  revenue: number;
}

export interface CreateCommunityRequest {
  name: string;
  address: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
}

export interface UpdateCommunityRequest extends CreateCommunityRequest {
  id: string;
}

export class CommunitiesService {
  static async getAllCommunities(): Promise<Community[]> {
    try {
      console.log('🏘️  Fetching communities...');
      
      // Add a small delay to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await ApiService.get<Community[]>(API_CONFIG.ENDPOINTS.COMMUNITIES);
      console.log('📡 Communities API response:', response);
      
      if (response.error) {
        console.error('❌ Communities API error:', response.error);
        
        // If authentication error, try once more after a delay
        if (response.error.toLowerCase().includes('not authenticated') || response.status === 401) {
          console.log('🔄 Retrying communities request after authentication error...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await ApiService.get<Community[]>(API_CONFIG.ENDPOINTS.COMMUNITIES);
          if (retryResponse.error) {
            throw new Error(retryResponse.error);
          }
          return retryResponse.data || [];
        }
        
        throw new Error(response.error);
      }
      
      console.log('✅ Communities loaded successfully:', response.data?.length, 'communities');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }
  }

  static async getCommunityById(id: string): Promise<Community> {
    try {
      const response = await ApiService.get<Community>(`${API_CONFIG.ENDPOINTS.COMMUNITIES}${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error fetching community:', error);
      throw error;
    }
  }

  static async createCommunity(communityData: CreateCommunityRequest): Promise<Community> {
    try {
      const response = await ApiService.post<Community>(API_CONFIG.ENDPOINTS.COMMUNITIES, communityData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  static async updateCommunity(communityData: UpdateCommunityRequest): Promise<Community> {
    try {
      const { id, ...data } = communityData;
            const response = await ApiService.put<Community>(`${API_CONFIG.ENDPOINTS.COMMUNITIES}${id}`, communityData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  static async deleteCommunity(id: string): Promise<void> {
    try {
      const response = await ApiService.delete(`${API_CONFIG.ENDPOINTS.COMMUNITIES}${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  static async toggleCommunityStatus(id: string, isActive: boolean): Promise<Community> {
    try {
      const response = await ApiService.patch<Community>(`${API_CONFIG.ENDPOINTS.COMMUNITIES}${id}/status`, {
        is_active: isActive
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error toggling community status:', error);
      throw error;
    }
  }

  static async getCommunityStats(): Promise<CommunityStats[]> {
    try {
      const response = await ApiService.get<CommunityStats[]>(`${API_CONFIG.ENDPOINTS.COMMUNITIES}stats`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching community stats:', error);
      throw error;
    }
  }

  static async searchCommunities(query: string): Promise<Community[]> {
    try {
      const response = await ApiService.get<Community[]>(`${API_CONFIG.ENDPOINTS.COMMUNITIES}search?q=${encodeURIComponent(query)}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error searching communities:', error);
      throw error;
    }
  }
}