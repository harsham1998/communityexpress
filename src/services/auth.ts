import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import ApiService from './api';

export interface AuthUser extends User {
  session?: any;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: UserRole;
    community_id?: string;
    apartment_number?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      const response = await ApiService.login(email, password);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        const loginData = response.data as LoginResponse;
        const { access_token, user } = loginData;
        
        console.log('🔐 Login successful, storing token...');
        
        // Store token
        await AsyncStorage.setItem('auth_token', access_token);
        console.log('✅ Token stored successfully');
        
        // Store user data
        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          communityId: user.community_id,
          apartmentNumber: user.apartment_number,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        return authUser;
      }

      return null;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    communityCode?: string,
    apartmentNumber?: string
  ): Promise<AuthUser | null> {
    try {
      const userData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        apartment_number: apartmentNumber,
      };

      const response = await ApiService.register(userData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        // For signUp, the response might just be the user data directly, not wrapped with access_token
        const userData = response.data as any; // Use any for now since we don't know the exact structure
        
        // Check if it's a login-style response or direct user data
        const user = userData.user || userData;
        
        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role as UserRole,
          communityId: user.community_id,
          apartmentNumber: user.apartment_number,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        return authUser;
      }

      return null;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      const response = await ApiService.getCurrentUser();
      
      if (response.error) {
        // Token might be expired, clear storage
        await this.signOut();
        return null;
      }

      if (response.data) {
        const userData = response.data as LoginResponse['user'];
        const authUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          role: userData.role,
          communityId: userData.community_id,
          apartmentNumber: userData.apartment_number,
          isActive: userData.is_active,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        return authUser;
      }

      // Fallback to stored user data
      const storedUser = await AsyncStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async joinCommunity(communityCode: string): Promise<boolean> {
    try {
      const response = await ApiService.joinCommunity(communityCode);
      
      if (response.error) {
        throw new Error(response.error);
      }

      return true;
    } catch (error) {
      console.error('Join community error:', error);
      throw error;
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }
}