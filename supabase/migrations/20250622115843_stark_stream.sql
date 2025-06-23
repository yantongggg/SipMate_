/*
  # Add URL column to wines table

  1. Changes
    - Add `url` column to `wines` table for storing Vivino or other wine URLs
    - Set default value to empty string for existing records
    - Allow NULL values for flexibility

  2. Notes
    - This migration adds the missing URL column that the application expects
    - Existing wine records will have NULL URL values initially
*/

-- Add URL column to wines table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'url'
  ) THEN
    ALTER TABLE public.wines ADD COLUMN url TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.wines.url IS 'External URL for wine (e.g., Vivino link)';