SipMate Wine Discovery
SipMate Wine Discovery is a comprehensive mobile and web application built with Expo and React Native, designed for wine enthusiasts to discover, manage, and share their wine experiences. It features a robust admin panel for managing the wine catalog and a user-friendly public interface for exploring wines, tracking tastings, and engaging with a community of fellow wine lovers.

Features
Admin Panel
Complete CRUD Operations: Create, read, update, and delete wine entries.
Image Management: Upload and manage wine images with previews.
Form Validation: Comprehensive validation for all input fields to ensure data integrity.
Search & Filter: Advanced search and filtering capabilities for efficient wine management.
Database Statistics: View real-time statistics and analytics about the wine catalog and user activity.
System Settings: Configure application-wide settings, including notifications, data management, and appearance.
Public Display
Detailed Wine Cards: Explore wines with rich details, including AI-generated summaries, food pairings, and tasting notes.
Multiple View Modes: Seamlessly switch between grid and detailed views of the wine collection.
Interactive Features: Save favorite wines to a personal library, add tasting notes, and track consumption history.
Wine Recommendations: An intelligent AI assistant helps users discover new wines based on mood, occasion, and budget.
Community Engagement: Share wine experiences, like posts, and comment on community discussions.
User Profiles: Manage personal profiles, view wine statistics, and access saved wines.
Responsive Design: Optimized for a consistent and engaging experience across various screen sizes and devices (mobile and web).
Technologies Used
Framework: Expo (SDK 52.0.30)
Routing: Expo Router (4.0.17)
UI: React Native
Styling: StyleSheet.create
Database & Authentication: Supabase
State Management: React Context API
Fonts: @expo-google-fonts (Playfair Display)
Icons: lucide-react-native
Storage: @react-native-async-storage/async-storage
Animations: react-native-reanimated
Gesture Handling: react-native-gesture-handler
Image Handling: expo-image-picker, expo-file-system, expo-sharing
Date Picker: Custom modal-based date picker
Location Picker: Custom modal-based location picker
Payments: RevenueCat (for future in-app purchases/subscriptions)
Project Structure
app/: Contains all routes and screens.
(tabs)/: Primary tab-based navigation.
admin/: Admin panel routes.
auth.tsx: Authentication screen.
wine-details.tsx: Detailed wine view.
_layout.tsx: Root layout.
components/: Reusable UI components (e.g., WineCard, SaveWineModal, DatePicker, LocationPicker).
contexts/: React Contexts for global state management (Auth, Wine, Theme, Settings).
hooks/: Custom React hooks (e.g., useFrameworkReady, useAuthGuard).
lib/: Utility functions (e.g., supabase.ts, imageUtils.ts).
supabase/: Supabase migrations and database schema.
types/: TypeScript type definitions.
Important Constraints
Web Platform Default: The project's default platform is Web. Native-only APIs (like Haptics, Local Authentication, some Sensors) are not available. Web-compatible alternatives or Platform.select() for platform-specific code must be used.
useFrameworkReady Hook: The useFrameworkReady hook code in app/_layout.tsx is REQUIRED and must NEVER be removed or modified. This code is essential for the framework to function properly.
Expo Managed Workflow: This project uses Expo managed workflow exclusively. DO NOT create ios or android directories. No native code files should be included in the project directly.
Styling: Use StyleSheet.create for all styling. DO NOT use NativeWind or any alternative styling libraries unless explicitly asked for.
Error Handling: Prefer showing errors directly in the UI instead of using the Alert API. Use error states in components to display error messages inline.
Environment Variables: Use Expo's environment variable system. DO NOT use Vite environment variables. Environment variables must be prefixed with EXPO_PUBLIC_.
Dependencies: ALWAYS maintain ALL existing dependencies in package.json. DO NOT remove any pre-configured dependencies.
Fonts: Use @expo-google-fonts packages for any font implementation. DO NOT use local font files or custom font loading methods. ALWAYS follow the standard pattern for loading and using Google Fonts.
File Management: To remove a route, use rm -rf "path/to/route/file".
Navigation Architecture:
Primary Navigation: Tabs using expo-router's built-in tab support.
Secondary Navigation: Stack Navigation, Modal Navigation, or Drawer Navigation can be implemented WITHIN tab screens.
Icons: Use the lucide icon library exclusively by importing icons as React components from lucide-react-native. Follow SVG prop defaults for consistency (size: 24, color: 'currentColor', strokeWidth: 2, absoluteStrokeWidth: false). For Lucide Lab or custom icons, use the Icon component.
Camera Usage: Use expo-camera for implementing camera features. Always check and request permissions before camera access.
API Routes: Expo Router enables writing secure server code for all platforms in the app directory using +api.ts extension. Project app.json must have "output": "server" under web configuration.
Preferred Libraries:
react-native-reanimated instead of Animated from react-native.
react-native-gesture-handler instead of PanResponder.
Payments: For subscriptions or in-app purchases, RevenueCat is the preferred solution. Note that RevenueCat requires native code and will not function in Bolt’s in-browser preview; a development build using the Expo Dev Client is needed for testing.
API Endpoints
GET /api/wines
Returns all wines with computed image URLs.


{
  "id": "uuid",
  "name": "Wine Name",
  "year": 2020,
  "rating": 4.5,
  "rating_count": 1247,
  "price": 89.99,
  "winery": "Winery Name",
  "region": "Region",
  "country": "Country",
  "type": "red",
  "url": "https://winery.com",
  "food_pairing": "Grilled meats, aged cheeses",
  "alcohol_content": 13.5,
  "wine_image_name": "wine.jpg",
  "ai_summary": "Detailed wine description...",
  "image_url": "https://project.supabase.co/storage/v1/object/public/wines-image/pictures/wine.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
POST /api/wines
Create a new wine entry with validation.

Image Storage
Bucket: wine-images
Path: pictures/
URL Pattern: https://gcvtaawcowvtytbsnftq.supabase.co/storage/v1/object/public/wine-images/pictures/{filename}
Upload Instructions:

Navigate to Supabase Storage.
Create bucket wine-images if it doesn't exist.
Set bucket to public.
Upload images to the pictures/ folder within the wine-images bucket.
Use the filename in the wine_image_name field in the database.
Validation Rules
Rating: 0-5 (decimal)
Type: red, white, rose, sparkling
Year: 1800 - current year
Price: Positive decimal
Alcohol Content: 0-50%
Name: Required
URL: Valid URL format
Sample Data
The project includes sample wine data for testing and demonstration purposes, featuring a variety of wine types, regions, and years.

Usage
Admin Access
Navigate to /admin to access the admin panel:

View all wines with search and filters.
Add new wines with a complete form.
Edit existing wines.
Delete wines with confirmation.
Manage system settings and view database statistics.
Public Display
The main collection view at / shows:

Grid or detailed view modes.
Advanced search and filtering.
Wine cards with all information.
Save functionality for authenticated users.
External URL links to winery websites.
Community posts and wine recommendations.
Development
Adding New Fields: To add new fields, update the Supabase migration file, TypeScript interfaces, form components, display components, and API endpoints as necessary.
Image Management: Images are stored in Supabase Storage, and their URLs are computed dynamically. Fallback images are provided for missing files.
Security
Row Level Security (RLS): Enabled on all relevant tables to ensure data privacy and access control.
Authentication: Admin functions and user-specific features require authentication.
Input Validation: Comprehensive input validation and sanitization are implemented to prevent data corruption and security vulnerabilities.
Secure Image Upload: Image upload handling is designed with security best practices in mind.
