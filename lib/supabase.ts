import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables with fallbacks
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://gcvtaawcowvtytbsnftq.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdnRhYXdjb3d2dHl0YnNuZnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDUwNDIsImV4cCI6MjA2NTk4MTA0Mn0.gHXScufDJvqlnbfHQa7M8X1cR2oO8MY2msV0bW6fDo8';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

// Validate that we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values.');
}

// Custom fetch function to handle session errors
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const response = await fetch(url, options);
  
  // Check for 403 status with session_not_found error
  if (response.status === 403) {
    try {
      const responseClone = response.clone();
      const body = await responseClone.text();
      
      if (body.includes('session_not_found')) {
        console.log('Stale session detected, signing out...');
        // Clear the invalid session
        await supabase.auth.signOut();
        
        // Return a successful response to prevent error propagation
        return new Response(JSON.stringify({ user: null, session: null }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      // If we can't parse the response, continue with original response
      console.warn('Could not parse response body:', error);
    }
  }
  
  // Check for 400 status with refresh_token_not_found error
  if (response.status === 400) {
    try {
      const responseClone = response.clone();
      const body = await responseClone.text();
      
      if (body.includes('refresh_token_not_found')) {
        console.log('Invalid refresh token detected, signing out...');
        // Clear the invalid session
        await supabase.auth.signOut();
        
        // Return a successful response to prevent error propagation
        return new Response(JSON.stringify({ user: null, session: null }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      // If we can't parse the response, continue with original response
      console.warn('Could not parse response body:', error);
    }
  }
  
  return response;
};

// Create the Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    fetch: customFetch,
  },
});

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connected successfully');
  }
});

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url');
};