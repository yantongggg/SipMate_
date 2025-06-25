/*
  # Fix profiles table achievements column

  1. Changes
    - Ensure the achievements column exists in the profiles table
    - Add the column if it doesn't exist to fix schema cache issues

  2. Security
    - No changes to existing RLS policies
*/

-- Add achievements column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'achievements'
  ) THEN
    ALTER TABLE profiles ADD COLUMN achievements jsonb DEFAULT '{}';
  END IF;
END $$;