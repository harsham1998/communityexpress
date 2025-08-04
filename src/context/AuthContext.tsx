import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, AuthUser } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    communityCode?: string,
    apartmentNumber?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  joinCommunity: (communityCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const authUser = await AuthService.signIn(email, password);
      setUser(authUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    communityCode?: string,
    apartmentNumber?: string
  ) => {
    try {
      setLoading(true);
      const authUser = await AuthService.signUp(
        email,
        password,
        firstName,
        lastName,
        phone,
        communityCode,
        apartmentNumber
      );
      setUser(authUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinCommunity = async (communityCode: string) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      setLoading(true);
      await AuthService.joinCommunity(communityCode);
      
      const updatedUser = await AuthService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Join community error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    logout: signOut, // Alias for signOut
    joinCommunity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};