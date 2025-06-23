-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create wines table
CREATE TABLE IF NOT EXISTS public.wines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  winery TEXT NOT NULL,
  region TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  food_pairing TEXT NOT NULL,
  alcohol_percentage DECIMAL(4,2) NOT NULL,
  description TEXT NOT NULL,
  wine_image_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('red', 'white')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for wines
ALTER TABLE public.wines ENABLE ROW LEVEL SECURITY;

-- Create policy for wines (public read access)
CREATE POLICY "Anyone can view wines" ON public.wines
  FOR SELECT USING (true);

-- Create saved_wines table (user's wine library)
CREATE TABLE IF NOT EXISTS public.saved_wines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wine_id UUID REFERENCES public.wines(id) ON DELETE CASCADE NOT NULL,
  date_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_tried TIMESTAMP WITH TIME ZONE,
  user_rating DECIMAL(3,2) CHECK (user_rating >= 0 AND user_rating <= 5),
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, wine_id)
);

-- Enable Row Level Security for saved_wines
ALTER TABLE public.saved_wines ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_wines
CREATE POLICY "Users can view own saved wines" ON public.saved_wines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved wines" ON public.saved_wines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved wines" ON public.saved_wines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved wines" ON public.saved_wines
  FOR DELETE USING (auth.uid() = user_id);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  wine_id UUID REFERENCES public.wines(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for community_posts
CREATE POLICY "Anyone can view community posts" ON public.community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security for post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for post_likes
CREATE POLICY "Users can view all post likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for wine images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wine-images', 'wine-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for wine images (public read access)
CREATE POLICY "Anyone can view wine images" ON storage.objects
  FOR SELECT USING (bucket_id = 'wine-images');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wines_type ON public.wines(type);
CREATE INDEX IF NOT EXISTS idx_wines_rating ON public.wines(rating);
CREATE INDEX IF NOT EXISTS idx_wines_price ON public.wines(price);
CREATE INDEX IF NOT EXISTS idx_saved_wines_user_id ON public.saved_wines(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wines_updated_at BEFORE UPDATE ON public.wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_wines_updated_at BEFORE UPDATE ON public.saved_wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();