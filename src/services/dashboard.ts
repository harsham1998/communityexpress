import ApiService from './api';
import { CommunitiesService, CommunityStats } from './communities';
import { VendorsService, VendorStats } from './vendors';

export interface DashboardStats {
  totalCommunities: number;
  totalVendors: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface OrderTrend {
  date: string;
  orders: number;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'new_user' | 'new_order' | 'vendor_active' | 'payment' | 'community_added';
  message: string;
  timestamp: string;
  icon: string;
  color: string;
}

export class DashboardService {
  static async getMasterDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await ApiService.get<DashboardStats>('/dashboard/stats');
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  static async getCommunityStats(): Promise<CommunityStats[]> {
    try {
      return await CommunitiesService.getCommunityStats();
    } catch (error) {
      console.error('Error fetching community stats:', error);
      throw error;
    }
  }

  static async getVendorStats(): Promise<VendorStats[]> {
    try {
      return await VendorsService.getVendorStats();
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      throw error;
    }
  }

  static async getOrderTrends(days: number = 7): Promise<OrderTrend[]> {
    try {
      const response = await ApiService.get<OrderTrend[]>(`/dashboard/order-trends?days=${days}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching order trends:', error);
      throw error;
    }
  }

  static async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const response = await ApiService.get<RecentActivity[]>('/dashboard/recent-activities');
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }
}