/*
  # Wine Discovery App Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users.id)
      - `username` (text, unique)
      - `email` (text)
      - `created_at` (timestamp)
      - `achievements` (jsonb for tracking milestones)
    
    - `wines`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text: red, white, rosé, sparkling)
      - `region` (text)
      - `year` (integer)
      - `description` (text)
      - `image_url` (text)
      - `alcohol_content` (numeric)
      - `created_at` (timestamp)
    
    - `saved_wines`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `wine_id` (uuid, references wines.id)
      - `rating` (integer, 1-5)
      - `date_consumed` (date)
      - `location` (text)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `community_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `wine_id` (uuid, references wines.id)
      - `content` (text)
      - `created_at` (timestamp)
    
    - `post_likes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts.id)
      - `user_id` (uuid, references profiles.id)
      - `created_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts.id)
      - `user_id` (uuid, references profiles.id)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  achievements jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create wines table
CREATE TABLE IF NOT EXISTS wines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('red', 'white', 'rosé', 'sparkling', 'dessert')),
  region text,
  year integer,
  description text,
  image_url text,
  alcohol_content numeric(3,1),
  created_at timestamptz DEFAULT now()
);

-- Create saved_wines table
CREATE TABLE IF NOT EXISTS saved_wines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wine_id uuid REFERENCES wines(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  date_consumed date,
  location text,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wine_id)
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wine_id uuid REFERENCES wines(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Wines policies (public read access)
CREATE POLICY "Anyone can read wines"
  ON wines FOR SELECT
  TO authenticated
  USING (true);

-- Saved wines policies
CREATE POLICY "Users can read own saved wines"
  ON saved_wines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved wines"
  ON saved_wines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved wines"
  ON saved_wines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved wines"
  ON saved_wines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Community posts policies
CREATE POLICY "Anyone can read posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Anyone can read likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);