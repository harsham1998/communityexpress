import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

export interface AuthUser extends User {
  session?: any;
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await this.getUserProfile(data.user.id);
        return userProfile;
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        let communityId = null;
        
        if (communityCode) {
          const { data: community } = await supabase
            .from('communities')
            .select('id')
            .eq('code', communityCode)
            .single();
          
          communityId = community?.id;
        }

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            community_id: communityId,
            apartment_number: apartmentNumber,
            role: 'user',
          });

        if (profileError) throw profileError;

        const userProfile = await this.getUserProfile(data.user.id);
        return userProfile;
      }

      return null;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const user: AuthUser = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        role: data.role,
        communityId: data.community_id,
        apartmentNumber: data.apartment_number,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return await this.getUserProfile(user.id);
      }

      const storedUser = await AsyncStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  static async joinCommunity(communityCode: string, userId: string): Promise<boolean> {
    try {
      const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('code', communityCode)
        .single();

      if (!community) {
        throw new Error('Invalid community code');
      }

      const { error } = await supabase
        .from('users')
        .update({ community_id: community.id })
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Join community error:', error);
      throw error;
    }
  }
}