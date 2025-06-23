# SipMate - Wine Discovery App

A premium wine recommendation and exploration platform built with Expo and Supabase.

## Setup Instructions

### 1. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. This will create all necessary tables, policies, and storage buckets

### 3. Storage Setup

Create the following folder structure in your Supabase Storage bucket named `wine-images`:
```
wine-images/
├── redwine_png/
│   └── (upload your red wine PNG files here)
└── whitewine_png/
    └── (upload your white wine PNG files here)
```

### 4. Data Import

#### Wine Data
Upload your wine data to the `wines` table. You can use the Supabase dashboard or create a migration script to import from your JSON files.

Example wine record structure:
```json
{
  "name": "Château Margaux",
  "winery": "Château Margaux",
  "region": "Bordeaux, France",
  "price": 850.00,
  "rating": 4.8,
  "food_pairing": "Red meat, game, strong cheeses",
  "alcohol_percentage": 13.5,
  "description": "An exceptional Bordeaux with complex aromas...",
  "wine_image_name": "chateau_margaux.png",
  "type": "red"
}
```

#### Image Upload
1. Go to Supabase Storage → wine-images bucket
2. Create folders: `redwine_png` and `whitewine_png`
3. Upload your PNG files to the appropriate folders
4. Ensure the file names match the `wine_image_name` field in your wine data

### 5. Authentication

The app uses Supabase Auth with username/password authentication. Users can register with:
- Username (required)
- Email (optional)
- Password (minimum 6 characters)

### 6. Features

- **Wine Collection**: Browse and search wines with advanced filtering
- **Wine Library**: Save wines to your personal collection
- **Recommendations**: AI-powered wine suggestions based on mood/occasion
- **Community**: Share wine experiences and interact with other users
- **Profile**: View your wine statistics and achievements

### 7. Development

```bash
npm install
npm run dev
```

### 8. Database Schema Overview

- `profiles`: User profiles linked to Supabase Auth
- `wines`: Wine catalog with metadata and images
- `saved_wines`: User's personal wine library
- `community_posts`: Social posts about wines
- `post_likes`: Like system for community posts
- `comments`: Comments on community posts

All tables include Row Level Security (RLS) policies for data protection.