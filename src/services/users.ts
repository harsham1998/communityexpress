import ApiService from './api';
import { API_CONFIG } from '../config/api';

export type UserRole = 'admin' | 'resident' | 'vendor' | 'security';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  community_id: string;
  community_name?: string;
  apartment_number?: string;
  created_at: string;
  updated_at: string;
  last_active?: string;
  is_verified: boolean;
}

export interface UserStats {
  userId: string;
  userName: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  lastActive: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  community_id: string;
  apartment_number?: string;
}

export interface UpdateUserRequest {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  apartment_number?: string;
}

export class UsersService {
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await ApiService.get<User[]>(API_CONFIG.ENDPOINTS.USERS);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async getUsersByCommunity(communityId: string): Promise<User[]> {
    try {
      const response = await ApiService.get<User[]>(`${API_CONFIG.ENDPOINTS.USERS}community/${communityId}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users by community:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User> {
    try {
      const response = await ApiService.get<User>(`${API_CONFIG.ENDPOINTS.USERS}${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await ApiService.post<User>(API_CONFIG.ENDPOINTS.USERS, userData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(userData: UpdateUserRequest): Promise<User> {
    try {
      const { id, ...data } = userData;
      const response = await ApiService.put<User>(`${API_CONFIG.ENDPOINTS.USERS}${id}`, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      const response = await ApiService.delete(`${API_CONFIG.ENDPOINTS.USERS}${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async toggleUserStatus(id: string, status: UserStatus): Promise<User> {
    try {
      const response = await ApiService.patch<User>(`${API_CONFIG.ENDPOINTS.USERS}${id}/status`, {
        status
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  static async getUserStats(): Promise<UserStats[]> {
    try {
      const response = await ApiService.get<UserStats[]>(`${API_CONFIG.ENDPOINTS.USERS}stats`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  static async searchUsers(query: string, communityId?: string): Promise<User[]> {
    try {
      let url = `${API_CONFIG.ENDPOINTS.USERS}search?q=${encodeURIComponent(query)}`;
      if (communityId) {
        url += `&community_id=${communityId}`;
      }
      const response = await ApiService.get<User[]>(url);
      return response.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  static async resendVerificationEmail(userId: string): Promise<void> {
    try {
      const response = await ApiService.post(`${API_CONFIG.ENDPOINTS.USERS}${userId}/resend-verification`);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  }
}