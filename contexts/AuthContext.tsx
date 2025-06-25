import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string;
  email: string | null;
  achievements: Record<string, any>;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signUp: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        // Handle array response from limit(1)
        setProfile(data && data.length > 0 ? data[0] : null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username}@sipmate.app`, // Use username as email prefix
        password,
      });

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid username or password. Please check your credentials and try again.' };
        } else if (error.message.includes('Email not confirmed')) {
          return { error: 'Please confirm your email address before signing in.' };
        } else if (error.message.includes('Too many requests')) {
          return { error: 'Too many login attempts. Please wait a moment and try again.' };
        } else {
          return { error: error.message };
        }
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    try {
      // First, check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .limit(1);

      if (existingProfile && existingProfile.length > 0) {
        return { error: 'Username is already taken. Please choose a different username.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: `${username}@sipmate.app`, // Use username as email prefix
        password,
      });

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('User already registered')) {
          return { error: 'An account with this username already exists. Please try signing in instead.' };
        } else if (error.message.includes('Password should be at least')) {
          return { error: 'Password must be at least 6 characters long.' };
        } else if (error.message.includes('Signup requires a valid password')) {
          return { error: 'Please enter a valid password.' };
        } else {
          return { error: error.message };
        }
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              email,
              achievements: {},
            }
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return { error: 'Account created but failed to set up profile. Please contact support.' };
        }
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: 'No user logged in' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}