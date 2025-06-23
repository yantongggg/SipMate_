import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { User } from '@/types/wine';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requireAuth: () => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth context...');
        
        // Check for existing session
        const currentUser = await authService.getCurrentUser();
        
        if (isMounted) {
          console.log('👤 Current user:', currentUser ? currentUser.username : 'None');
          setUser(currentUser);
          setIsLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = authService.onAuthStateChange((user) => {
          if (isMounted) {
            console.log('🔄 Auth state changed in context:', user ? user.username : 'Logged out');
            setUser(user);
            setIsLoading(false);
          }
        });

        unsubscribe = () => subscription?.unsubscribe();
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 Context: Starting login...');
      const result = await authService.login(username, password);
      if (result.success) {
        // User state will be updated by the auth state listener
        console.log('✅ Context: Login successful, waiting for auth state update...');
      }
      return result;
    } catch (error) {
      console.error('❌ Login error in context:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('📝 Context: Starting registration...');
      const result = await authService.register(username, email, password);
      if (result.success) {
        // User state will be updated by the auth state listener
        console.log('✅ Context: Registration successful, waiting for auth state update...');
      }
      return result;
    } catch (error) {
      console.error('❌ Registration error in context:', error);
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🔓 Context: Starting logout process...');
      console.log('👤 Current user before logout:', user ? user.username : 'None');
      
      // Set loading state
      setIsLoading(true);
      
      // Clear user state immediately to update UI quickly
      console.log('🧹 Context: Clearing user state...');
      setUser(null);
      
      // Perform the actual logout
      console.log('🔐 Context: Calling authService.logout()...');
      await authService.logout();
      
      console.log('✅ Context: Logout completed successfully');
      
      // Navigate to auth screen - use replace to prevent back navigation
      console.log('🧭 Context: Navigating to auth screen...');
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('❌ Context: Logout error:', error);
      
      // Even if logout fails, clear local state and navigate
      console.log('⚠️ Context: Forcing logout despite error...');
      setUser(null);
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  const requireAuth = () => {
    return !!user;
  };

  const refreshUserData = async () => {
    try {
      console.log('🔄 Context: Refreshing user data...');
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      console.log('✅ Context: User data refreshed');
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      requireAuth,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}