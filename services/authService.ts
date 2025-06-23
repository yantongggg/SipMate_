import { supabase } from '@/lib/supabase';
import { User } from '@/types/wine';

export const authService = {
  // Helper function to sanitize username for email construction
  _sanitizeUsernameForEmail(username: string): string {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '') // Remove invalid email characters
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing dots, underscores, hyphens
      .replace(/[._-]{2,}/g, '_') // Replace multiple consecutive special chars with single underscore
      || 'user'; // Fallback if username becomes empty after sanitization
  },

  async register(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Registering user:', username, email);
      
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, error: 'Username already exists' };
      }

      // Generate a consistent email format with sanitized username
      const sanitizedUsername = this._sanitizeUsernameForEmail(username);
      const userEmail = email.trim() || `${sanitizedUsername}@sipmate.local`;
      console.log('Using email:', userEmail);

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        }
      });

      if (authError) {
        // Only log errors that aren't already handled gracefully by the UI
        if (authError.message !== 'User already registered') {
          console.error('Auth error:', authError);
        }
        
        // Provide more user-friendly error messages
        if (authError.message === 'User already registered') {
          return { success: false, error: 'This email is already registered. Please use a different email or sign in.' };
        }
        
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' };
      }

      console.log('User created:', authData.user.id);

      // Check if profile already exists for this user ID before attempting to create one
      const { data: existingUserProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (existingUserProfile) {
        console.log('Profile already exists for user ID:', authData.user.id);
        
        // Profile already exists, just sign in the user
        const { error: finalSignInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password,
        });

        if (finalSignInError) {
          console.error('Final sign-in error:', finalSignInError);
          return { success: false, error: 'Registration completed but auto sign-in failed. Please sign in manually.' };
        }

        return { success: true };
      }

      // Create profile using a direct insert (bypassing RLS temporarily)
      // We'll use the service role client for this operation
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          email: userEmail, // Store the actual email used for auth
        });

      if (profileError) {
        // Handle specific duplicate username constraint violation
        if (profileError.code === '23505' && profileError.message.includes('profiles_username_key')) {
          console.log('Username already exists during profile creation:', username);
          return { success: false, error: 'Username already exists. Please choose a different one.' };
        }
        
        // Handle duplicate primary key (user ID) constraint violation
        if (profileError.code === '23505' && profileError.message.includes('profiles_pkey')) {
          console.log('Profile with this user ID already exists, proceeding with sign-in');
          
          // Profile already exists, just sign in the user
          const { error: finalSignInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password,
          });

          if (finalSignInError) {
            console.error('Final sign-in error after duplicate key:', finalSignInError);
            return { success: false, error: 'Registration completed but auto sign-in failed. Please sign in manually.' };
          }

          return { success: true };
        }
        
        console.error('Profile error:', profileError);
        
        // If profile creation fails due to RLS, try with the authenticated user context
        if (profileError.code === '42501' || profileError.message.includes('permission')) {
          console.log('Retrying profile creation with user session...');
          
          // First sign in the user to establish session
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password,
          });

          if (!signInError) {
            // Retry profile creation with authenticated session
            const { error: retryProfileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                username,
                email: userEmail, // Store the actual email used for auth
              });

            if (retryProfileError) {
              // Handle duplicate username in retry attempt as well
              if (retryProfileError.code === '23505' && retryProfileError.message.includes('profiles_username_key')) {
                console.log('Username already exists during retry profile creation:', username);
                return { success: false, error: 'Username already exists. Please choose a different one.' };
              }
              
              // Handle duplicate primary key in retry attempt
              if (retryProfileError.code === '23505' && retryProfileError.message.includes('profiles_pkey')) {
                console.log('Profile with this user ID already exists during retry, proceeding');
                return { success: true };
              }
              
              console.error('Retry profile error:', retryProfileError);
              return { success: false, error: 'Failed to create user profile. Please try again.' };
            }
          } else {
            console.error('Sign in for profile creation failed:', signInError);
            return { success: false, error: 'Failed to create user profile. Please try again.' };
          }
        } else {
          return { success: false, error: 'Failed to create user profile. Please try again.' };
        }
      }

      console.log('Profile created successfully');

      // Ensure user is signed in after successful registration
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (finalSignInError) {
        console.error('Final sign-in error:', finalSignInError);
        // Don't fail registration if auto sign-in fails, user can manually sign in
        console.log('Registration successful, but auto sign-in failed. User can manually sign in.');
      }

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  },

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Starting login process for username:', username);
      
      // First, get user's profile data with detailed logging
      console.log('🔍 Looking up profile for username:', username);
      
      // Use a more robust query that handles case sensitivity and potential RLS issues
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email, username, id')
        .ilike('username', username) // Case-insensitive search
        .limit(1);

      console.log('📊 Profile query result:', { profiles, profileError });

      if (profileError) {
        console.error('❌ Profile lookup error:', profileError);
        return { success: false, error: 'Database error. Please try again.' };
      }

      if (!profiles || profiles.length === 0) {
        console.error('❌ No profile found for username:', username);
        return { success: false, error: 'Invalid username or password' };
      }

      const profile = profiles[0];
      console.log('✅ Profile found:', profile);

      // Build list of emails to try for authentication
      const emailsToTry = [];
      
      // First priority: Use the stored profile email if it exists and is not empty
      if (profile.email && profile.email.trim() !== '') {
        emailsToTry.push(profile.email);
      }
      
      // Second priority: Try the sanitized username format
      const sanitizedUsername = this._sanitizeUsernameForEmail(username);
      const fallbackEmail = `${sanitizedUsername}@sipmate.local`;
      if (!emailsToTry.includes(fallbackEmail)) {
        emailsToTry.push(fallbackEmail);
      }
      
      // Third priority: Try the original username format (in case sanitization changed it)
      const originalEmail = `${username.toLowerCase()}@sipmate.local`;
      if (!emailsToTry.includes(originalEmail)) {
        emailsToTry.push(originalEmail);
      }

      console.log('📧 Trying emails in order:', emailsToTry);

      let authData = null;
      let lastAuthError = null;
      let successfulEmail = null;

      // Try each email format until one works
      for (const email of emailsToTry) {
        console.log('🔑 Attempting authentication with email:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.log('❌ Authentication failed with email:', email, 'Error:', error.message);
          lastAuthError = error;
          continue;
        }

        if (data.user) {
          console.log('✅ Authentication successful with email:', email);
          authData = data;
          successfulEmail = email;
          break;
        }
      }

      if (!authData) {
        console.error('❌ All authentication attempts failed. Last error:', lastAuthError);
        
        // Provide user-friendly error messages
        if (lastAuthError && (
          lastAuthError.message.includes('Invalid login credentials') || 
          lastAuthError.message.includes('Email not confirmed') ||
          lastAuthError.message.includes('Invalid email or password')
        )) {
          return { success: false, error: 'Invalid username or password. Please check your credentials and try again.' };
        }
        
        return { success: false, error: 'Login failed. Please try again.' };
      }

      // Verify the user ID matches the profile
      if (authData.user.id !== profile.id) {
        console.error('❌ User ID mismatch:', authData.user.id, 'vs', profile.id);
        await supabase.auth.signOut();
        return { success: false, error: 'Authentication error. Please try again.' };
      }

      // Update the profile with the correct email if it's different
      if (successfulEmail && profile.email !== successfulEmail) {
        console.log('🔄 Updating profile email from', profile.email, 'to', successfulEmail);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ email: successfulEmail })
          .eq('id', profile.id);
          
        if (updateError) {
          console.error('❌ Failed to update profile email:', updateError);
        } else {
          console.log('✅ Profile email updated successfully');
        }
      }

      console.log('🎉 Login successful!');
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('Getting current user...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        
        // Check if this is a session_not_found error and clear the stale session
        if (sessionError.message && sessionError.message.includes('session_not_found')) {
          console.log('Detected stale session, clearing it...');
          await supabase.auth.signOut();
        }
        
        // Check if this is an invalid login credentials error and clear the invalid session
        if (sessionError.message && sessionError.message.includes('Invalid login credentials')) {
          console.log('Detected invalid login credentials, clearing session...');
          await supabase.auth.signOut();
        }
        
        return null;
      }

      if (!session?.user) {
        console.log('No session found');
        return null;
      }

      console.log('Session found for user:', session.user.id);

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        return null;
      }

      if (!profile) {
        console.log('No profile found for user:', session.user.id);
        return null;
      }

      console.log('Profile found:', profile.username);

      return {
        id: profile.id,
        username: profile.username,
        email: profile.email || '',
        password: '', // Don't return password
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      console.log('🔓 AuthService: Starting logout process...');
      
      // First, clear any cached data or state
      console.log('🧹 Clearing local state...');
      
      // Clear session from Supabase with proper error handling
      console.log('🔐 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      });
      
      if (error) {
        console.error('❌ AuthService: Supabase logout error:', error);
        
        // Even if Supabase logout fails, we should still clear local state
        // This handles cases where the session is already invalid
        if (error.message.includes('session_not_found') || 
            error.message.includes('Invalid session') ||
            error.message.includes('JWT expired')) {
          console.log('⚠️ Session already invalid, continuing with logout...');
        } else {
          throw error;
        }
      }
      
      // Additional cleanup - clear any stored tokens or cached data
      console.log('🧽 Performing additional cleanup...');
      
      // Force clear any remaining session data
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        // Ignore refresh errors during logout
        console.log('🔄 Refresh session failed during logout (expected)');
      }
      
      console.log('✅ AuthService: Logout completed successfully');
    } catch (error) {
      console.error('💥 AuthService: Logout failed:', error);
      
      // For logout, we should be more permissive with errors
      // If we can't reach the server, we should still clear local state
      console.log('⚠️ Forcing local logout despite server error...');
      
      // Don't throw the error - just log it and continue
      // This ensures the UI can still update even if server logout fails
    }
  },

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Starting password update...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected password update error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, !!session);
      
      // Handle logout event specifically
      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing user state');
        callback(null);
        return;
      }
      
      if (session?.user) {
        // Get user profile when session exists
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            // Check if profile email is out of sync with auth email
            if (profile.email !== session.user.email) {
              console.log('🔄 Email mismatch detected, updating profile email...');
              console.log('Profile email:', profile.email);
              console.log('Auth email:', session.user.email);
              
              // Update the profile with the correct email from auth
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ email: session.user.email })
                .eq('id', session.user.id);

              if (updateError) {
                console.error('❌ Failed to update profile email:', updateError);
              } else {
                console.log('✅ Profile email updated successfully');
                // Update the profile object with the new email
                profile.email = session.user.email;
              }
            }

            const user: User = {
              id: profile.id,
              username: profile.username,
              email: profile.email || '',
              password: '',
            };
            console.log('✅ Auth state: user found', user.username);
            callback(user);
          } else {
            console.log('❌ Auth state: no profile found for user', session.user.id);
            // Auto-create profile for OAuth users
            await this.createProfileForOAuthUser(session.user);
            callback(null);
          }
        } catch (error) {
          console.error('💥 Error fetching profile in auth state change:', error);
          callback(null);
        }
      } else {
        console.log('🚫 Auth state: no session');
        callback(null);
      }
    });
  },

  // Google OAuth login - Disabled for now due to iframe restrictions
  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    return { 
      success: false, 
      error: 'Google login is temporarily disabled. Please use username/password login.' 
    };
  },

  // Helper function to create profile for OAuth users
  async createProfileForOAuthUser(user: any): Promise<void> {
    try {
      console.log('🔧 Creating profile for OAuth user:', user.id);
      
      // Extract username from email or use a default
      const email = user.email || '';
      const username = email.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('✅ Profile already exists for OAuth user');
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username,
          email,
        });

      if (profileError) {
        console.error('❌ Failed to create OAuth user profile:', profileError);
        
        // If username conflict, try with a unique suffix
        if (profileError.code === '23505' && profileError.message.includes('profiles_username_key')) {
          const uniqueUsername = `${username}_${Date.now()}`;
          const { error: retryError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: uniqueUsername,
              email,
            });

          if (retryError) {
            console.error('❌ Failed to create OAuth user profile with unique username:', retryError);
          } else {
            console.log('✅ OAuth user profile created with unique username:', uniqueUsername);
          }
        }
      } else {
        console.log('✅ OAuth user profile created successfully:', username);
      }
    } catch (error) {
      console.error('💥 Unexpected error creating OAuth user profile:', error);
    }
  }
};