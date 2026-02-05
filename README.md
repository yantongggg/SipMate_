# 🍷 SipMate Wine Discovery

SipMate Wine Discovery is a modern mobile and web app built with **Expo** and **React Native** for wine lovers to discover, track, and share their wine experiences. It includes a robust admin panel for catalog management and an engaging public interface for browsing and community interaction.

---

## ✨ Features

### 🛠️ Admin Panel

- **Manage Wines:** Create, edit, and delete entries.
- **Image Uploads:** Upload and preview wine images.
- **Search & Filter:** Quickly find and organize wines.
- **Statistics:** View real-time data and usage analytics.

### 🌐 Public App

- **Wine Explorer:** Browse detailed wine profiles with AI-generated summaries and food pairings.
- **Favorites & Notes:** Save wines and track tasting history.
- **Recommendations:** Get personalized suggestions based on mood, occasion, and budget.
- **Community:** Share experiences and engage with other users.
- **Responsive Design:** Optimized for web and mobile devices.

---

## 🛠️ Tech Stack

- **Framework:** Expo (SDK 52)
- **Routing:** Expo Router
- **Database & Authentication:** Supabase
- **State Management:** React Context API
- **Storage:** Supabase Storage
- **UI:** React Native + StyleSheet
- **Icons:** lucide-react-native
- **Animations:** react-native-reanimated
- **Gestures:** react-native-gesture-handler
- **Payments:** RevenueCat (planned)

---

## 📂 Project Structure
app/ Application routes and screens
(tabs)/ Main navigation tabs
admin/ Admin panel screens
auth.tsx Authentication screen
wine-details.tsx Wine detail view
components/ Reusable UI components
contexts/ Global state providers
hooks/ Custom React hooks
lib/ Utility functions (e.g., Supabase helpers)
supabase/ Database schema and migrations
types/ TypeScript definitions


---

## 🛡️ Security & Constraints

- Row-Level Security enabled in Supabase
- Authentication required for admin and user features
- Expo Managed Workflow only
- Styling must use StyleSheet.create
- Environment variables must start with EXPO_PUBLIC_
- Icons must use lucide-react-native
- Errors displayed inline instead of Alert

---

## 📄 API Endpoints

GET /api/wines

- Returns all wines with metadata

POST /api/wines

- Creates a new wine entry

Validation Rules:

- Rating: 0–5
- Year: 1800–current year
- Alcohol: 0–50%
- Price: Positive decimal
- Type: red, white, rose, sparkling

---

## 🖼 Image Storage

- Bucket: wine-images
- Folder: pictures
- URL format: https://supabase.com/dashboard/project/gcvtaawcowvtytbsnftq/storage/buckets/wine-images

---

## 📈 Sample Data

Includes example wines for testing.

---

## 🤝 Contributing

Contributions are welcome. Please open an issue or pull request.

---

## 📫 Contact

Questions or suggestions? Open an issue on the repository.

---

## 📝 License

MIT License.


//Test Security Scan


