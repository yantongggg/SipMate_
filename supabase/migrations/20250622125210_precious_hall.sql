/*
  # Fix authentication login policy

  1. Security Changes
    - Add policy to allow anonymous users to read profiles for login purposes
    - This enables the login process to look up user emails by username
    - Works alongside existing authenticated user policies

  2. Changes Made
    - Added "Allow anonymous read of profiles for login" policy
    - Allows SELECT operations for the 'anon' role on profiles table
    - Resolves the "Invalid login credentials" error during login
*/

-- Create policy to allow anonymous users to read profiles for login
CREATE POLICY "Allow anonymous read of profiles for login" ON public.profiles
  FOR SELECT TO anon USING (true);