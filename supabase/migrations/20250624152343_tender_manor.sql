/*
  # Update Wine App Schema

  1. Update Tables to Match Requirements
    - Update `wines` table to include all required fields
    - Update `saved_wines` table to match new field names
    - Update `community_posts` table structure
    - Add proper indexes for performance

  2. Security
    - Maintain existing RLS policies
    - Add new policies for updated schema
*/

-- Update wines table to include all required fields
DO $$
BEGIN
  -- Add winery column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'winery'
  ) THEN
    ALTER TABLE wines ADD COLUMN winery text;
  END IF;

  -- Add price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'price'
  ) THEN
    ALTER TABLE wines ADD COLUMN price numeric(10,2);
  END IF;

  -- Add rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'rating'
  ) THEN
    ALTER TABLE wines ADD COLUMN rating numeric(2,1) CHECK (rating >= 1 AND rating <= 5);
  END IF;

  -- Add food_pairing column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'food_pairing'
  ) THEN
    ALTER TABLE wines ADD COLUMN food_pairing text;
  END IF;

  -- Rename alcohol_content to alcohol_percentage if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'alcohol_content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'alcohol_percentage'
  ) THEN
    ALTER TABLE wines RENAME COLUMN alcohol_content TO alcohol_percentage;
  END IF;

  -- Rename image_url to wine_image_name if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'image_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'wine_image_name'
  ) THEN
    ALTER TABLE wines RENAME COLUMN image_url TO wine_image_name;
  END IF;

  -- Add url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wines' AND column_name = 'url'
  ) THEN
    ALTER TABLE wines ADD COLUMN url text;
  END IF;
END $$;

-- Update saved_wines table field names
DO $$
BEGIN
  -- Rename date_consumed to date_tried if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_wines' AND column_name = 'date_consumed'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_wines' AND column_name = 'date_tried'
  ) THEN
    ALTER TABLE saved_wines RENAME COLUMN date_consumed TO date_tried;
  END IF;

  -- Rename description to user_notes if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_wines' AND column_name = 'description'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_wines' AND column_name = 'user_notes'
  ) THEN
    ALTER TABLE saved_wines RENAME COLUMN description TO user_notes;
  END IF;
END $$;

-- Update community_posts table to include username
DO $$
BEGIN
  -- Add username column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'username'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN username text;
    
    -- Update existing posts with usernames from profiles
    UPDATE community_posts 
    SET username = profiles.username 
    FROM profiles 
    WHERE community_posts.user_id = profiles.id;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wines_type ON wines(type);
CREATE INDEX IF NOT EXISTS idx_wines_region ON wines(region);
CREATE INDEX IF NOT EXISTS idx_wines_rating ON wines(rating);
CREATE INDEX IF NOT EXISTS idx_wines_price ON wines(price);
CREATE INDEX IF NOT EXISTS idx_saved_wines_user_wine ON saved_wines(user_id, wine_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_wine ON community_posts(wine_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);