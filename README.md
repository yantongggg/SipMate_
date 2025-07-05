🍷 SipMate Wine Discovery
SipMate Wine Discovery is a modern web and mobile app for wine enthusiasts. Built with Expo and React Native, it helps users discover, track, and share their wine experiences while providing an admin panel to manage the catalog.

✨ Key Features
Admin Panel

Create, edit, and delete wines

Upload and manage images

Search, filter, and view statistics

Public App

Browse detailed wine profiles with AI-generated summaries and food pairings

Save favorites and tasting notes

Get personalized recommendations

Engage with the wine community

Manage personal profiles

Responsive Design

Optimized for web and mobile

🛠️ Technology
Framework: Expo + React Native

Database: Supabase

Routing: Expo Router

State Management: React Context API

Storage: Supabase Storage

Payments: RevenueCat (planned)

Animations & Gestures: Reanimated, Gesture Handler

🗂️ Project Structure Overview
pgsql
Copy
Edit
app/           Screens and routes
components/    Reusable UI components
contexts/      Global state
hooks/         Custom hooks
lib/           Utilities
supabase/      Database schema
types/         Type definitions
⚙️ Development Notes
Expo Managed Workflow only (no native code)

Use StyleSheet.create for styling

Use lucide-react-native for icons

All environment variables must be prefixed with EXPO_PUBLIC

🛡️ Security
Row Level Security enabled in Supabase

Input validation and sanitization throughout

Auth required for admin and personal features

🚀 Getting Started
Clone the repo, install dependencies, and start the dev server:

bash
Copy
Edit
git clone https://github.com/yantongggg/SipMate_
cd sipmate
npm install
npm run dev
💬 License & Contributions
Open to contributions. See CONTRIBUTING.md for details.

📫 Contact
Questions or suggestions? Open an issue.

