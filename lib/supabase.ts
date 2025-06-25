import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get public URL for wine images
export const getWineImageUrl = (imageName: string | null) => {
  if (!imageName) return null;
  return supabase.storage.from('wine-images').getPublicUrl(imageName).data.publicUrl;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          achievements: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email?: string | null;
          achievements?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string | null;
          achievements?: Record<string, any>;
          created_at?: string;
        };
      };
      wines: {
        Row: {
          id: string;
          name: string;
          winery: string | null;
          type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert';
          region: string | null;
          year: number | null;
          price: number | null;
          rating: number | null;
          food_pairing: string | null;
          alcohol_percentage: number | null;
          description: string | null;
          wine_image_name: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          winery?: string | null;
          type: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert';
          region?: string | null;
          year?: number | null;
          price?: number | null;
          rating?: number | null;
          food_pairing?: string | null;
          alcohol_percentage?: number | null;
          description?: string | null;
          wine_image_name?: string | null;
          url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          winery?: string | null;
          type?: 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert';
          region?: string | null;
          year?: number | null;
          price?: number | null;
          rating?: number | null;
          food_pairing?: string | null;
          alcohol_percentage?: number | null;
          description?: string | null;
          wine_image_name?: string | null;
          url?: string | null;
          created_at?: string;
        };
      };
      saved_wines: {
        Row: {
          id: string;
          user_id: string;
          wine_id: string;
          rating: number | null;
          date_tried: string | null;
          user_notes: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wine_id: string;
          rating?: number | null;
          date_tried?: string | null;
          user_notes?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wine_id?: string;
          rating?: number | null;
          date_tried?: string | null;
          user_notes?: string | null;
          location?: string | null;
          created_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          wine_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          wine_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          wine_id?: string | null;
          content?: string;
          created_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
};