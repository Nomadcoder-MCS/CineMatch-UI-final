# ✅ Real ML Recommender Integration - Complete

## 🎯 What Was Implemented

Connected the **real ML recommender** (MovieLens 32M + TMDb + TF-IDF + cosine similarity) to the **React UI** with full **database persistence** for user preferences, watchlist, and feedback.

---

## 📊 Database Schema (Already in Place)

### Tables Created via SQLAlchemy ORM

All tables are automatically created on backend startup via `Base.metadata.create_all(bind=engine)`.

#### 1. `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `user_preferences`
```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    preferred_genres TEXT,      -- pipe-separated: "action|sci-fi|comedy"
    services TEXT,              -- pipe-separated: "Netflix|Hulu"
    runtime_min INTEGER,
    runtime_max INTEGER,
    original_languages TEXT,    -- pipe-separated: "en|es"
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3. `watchlist_items`
```sql
CREATE TABLE watchlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    movie_id INTEGER,
    title TEXT,
    service TEXT,
    watched BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 4. `user_feedback`
```sql
CREATE TABLE user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    movie_id INTEGER,
    signal TEXT,  -- "like" | "dislike" | "not_interested"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Movie catalog NOT in database** - remains in ML artifacts (CSV + npz + pkl files) for performance.

---

## 🔌 Backend Endpoints

### Auth

#### `POST /auth/identify`
**Purpose:** Create or retrieve user by email (bootstrap endpoint)

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "created_at": "2025-01-15T10:00:00"
}
```

**Behavior:**
- Looks up user by email
- Returns existing user if found (same ID every time)
- Creates new user if not found
- No `X-User-Id` header required

---

### Preferences

#### `GET /api/preferences/me`
**Purpose:** Load user preferences from database

**Headers:** `X-User-Id: 1`

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "preferred_genres": ["action", "sci-fi", "comedy"],
  "services": ["Netflix", "Hulu"],
  "runtime_min": 90,
  "runtime_max": 150,
  "original_languages": ["en"],
  "updated_at": "2025-01-15T10:05:00"
}
```

#### `PUT /api/preferences/me`
**Purpose:** Save user preferences to database

**Headers:** `X-User-Id: 1`

**Request:**
```json
{
  "preferred_genres": ["action", "sci-fi"],
  "services": ["Netflix"],
  "runtime_min": 80,
  "runtime_max": 140,
  "original_languages": ["en"]
}
```

**Response:** Same as GET

---

### Watchlist

#### `GET /api/watchlist`
**Purpose:** Get user's watchlist

**Headers:** `X-User-Id: 1`

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "movie_id": 862,
    "title": "Blade Runner",
    "service": "Netflix",
    "watched": false,
    "created_at": "2025-01-15T10:10:00"
  }
]
```

#### `POST /api/watchlist`
**Purpose:** Add movie to watchlist

**Headers:** `X-User-Id: 1`

**Request:**
```json
{
  "movie_id": 862,
  "title": "Blade Runner",
  "service": "Netflix"
}
```

#### `DELETE /api/watchlist/{movie_id}`
**Purpose:** Remove movie from watchlist

**Headers:** `X-User-Id: 1`

#### `POST /api/watchlist/{movie_id}/watched`
**Purpose:** Mark movie as watched

**Headers:** `X-User-Id: 1`

---

### Feedback

#### `POST /api/feedback`
**Purpose:** Record user feedback (like/dislike/not interested)

**Headers:** `X-User-Id: 1`

**Request:**
```json
{
  "movie_id": 862,
  "signal": "like"  // or "dislike" or "not_interested"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "movie_id": 862,
  "signal": "like",
  "created_at": "2025-01-15T10:15:00"
}
```

---

### **⭐ Recommendations (NEW - Real ML Recommender)**

#### `GET /api/recommendations`
**Purpose:** Get personalized recommendations using real ML model + user data from database

**Headers:** `X-User-Id: 1`

**Query Params:** `limit` (default: 20, max: 100)

**Example:** `GET /api/recommendations?limit=20`

**What It Does:**
1. Loads `UserPreferences` from database for current user
2. Loads `UserFeedback` (likes/dislikes) from database
3. Builds ML `UserPreferences` object with:
   - `preferred_genres` from DB
   - `services` from DB
   - `runtime_min`, `runtime_max` from DB
   - `liked_movie_ids` from feedback table (signal="like")
   - `disliked_movie_ids` from feedback table (signal="dislike")
4. Calls `recommender.recommend(prefs, top_k=limit)`
5. Returns personalized recommendations

**Response:**
```json
{
  "recommendations": [
    {
      "movie_id": 862,
      "title": "Blade Runner",
      "year": 1982,
      "runtime": 117,
      "overview": "In the near future...",
      "genres": ["sci-fi", "thriller"],
      "services": ["Netflix", "Prime Video"],
      "score": 0.84,
      "explanation": "Matches your preferred genres: sci-fi • Available on Netflix"
    }
  ],
  "count": 20,
  "user_id": 1
}
```

**Backend Console Output:**
```
============================================================
Building recommendations for user: Jane Smith (ID: 1)
  Preferred genres: ['action', 'sci-fi', 'comedy']
  Services: ['Netflix', 'Hulu']
  Runtime: 90-150 min
  Liked movies: 5
  Disliked movies: 2
============================================================
Generating recommendations for user: 1
============================================================
✓ Filtered to 20 recommendations
✓ Generated 20 personalized recommendations
```

---

## 🎨 Frontend Integration

### Components Updated

#### 1. **HomePage** ⭐ Major Update

**File:** `src/pages/HomePage.jsx`

**Changes:**
```javascript
// OLD: Hard-coded user and mock data
const userId = 'user123';
const [movies, setMovies] = useState(mockMovies);

// NEW: Real user from AuthContext
const { user } = useAuth();

// NEW: Load recommendations from real ML backend
const loadRecommendations = async () => {
  const response = await api.get('/api/recommendations?limit=20');
  setMovies(response.recommendations || []);
};
```

**Features:**
- ✅ Uses `AuthContext.user` for personalized greeting
- ✅ Calls `GET /api/recommendations` on mount
- ✅ No preferences passed in request body (loaded from DB)
- ✅ Displays real ML recommendations with scores and explanations
- ✅ Error handling with retry button
- ✅ Empty state with "Set Preferences" button
- ✅ Loading state with friendly message
- ✅ Redirects to landing if not authenticated

**User Experience:**
1. User signs in
2. HomePage loads their preferences from DB
3. HomePage loads their feedback (likes/dislikes) from DB
4. ML recommender generates personalized picks
5. User sees recommendations based on:
   - Their preferred genres
   - Their streaming services
   - Their runtime preferences
   - Movies they've liked before
   - Excluding movies they've disliked

#### 2. **ProfilePage** ✅ Already Updated

**Status:** Complete
- Loads preferences from `GET /api/preferences/me`
- Saves preferences to `PUT /api/preferences/me`
- Real user data display
- Working inline preferences editor

#### 3. **WatchlistPage** ✅ Already Updated

**Status:** Complete
- Loads from `GET /api/watchlist`
- Remove via `DELETE /api/watchlist/{movie_id}`
- Mark watched via `POST /api/watchlist/{movie_id}/watched`

#### 4. **MovieCard** ✅ Already Updated

**Status:** Complete
- 👍 calls `POST /api/feedback` with `signal: "like"`
- 👎 calls `POST /api/feedback` with `signal: "dislike"`
- "Not interested" calls `POST /api/feedback` with `signal: "not_interested"`
- "+ Watchlist" calls `POST /api/watchlist`

---

## 🔄 Complete User Journey

### 1. First-Time User
```
1. Visit landing page
2. Enter name: "Jane Smith", email: "jane@example.com"
3. Click "Get started"
4. Backend creates user (ID: 1)
5. Navigate to /home
6. See message: "Set your preferences to get personalized recommendations"
7. Click "Set Preferences" → Navigate to /profile
8. Select genres: action, sci-fi
9. Select services: Netflix
10. Set runtime: 90-150 min
11. Click "Save"
12. Backend saves to user_preferences table
13. Navigate back to /home
14. Backend loads preferences + feedback from DB
15. ML recommender generates 20 personalized movies
16. User sees recommendations with explanations
```

### 2. Providing Feedback
```
1. User browses recommendations on /home
2. Clicks 👍 on "Blade Runner"
   → Saved to user_feedback (user_id=1, movie_id=862, signal="like")
3. Clicks 👎 on "The Notebook"
   → Saved to user_feedback (user_id=1, movie_id=11, signal="dislike")
4. Clicks "+ Watchlist" on "The Matrix"
   → Saved to watchlist_items (user_id=1, movie_id=13)
5. Refreshes page
6. ML recommender now considers:
   - Preferred genres: action, sci-fi
   - Services: Netflix
   - Liked movies: [862]
   - Disliked movies: [11]
7. Recommendations are MORE personalized (similar to Blade Runner, not like The Notebook)
```

### 3. Returning User
```
1. User signs out
2. User closes browser
3. Next day: Opens browser, visits landing page
4. Enters same email: "jane@example.com"
5. Backend finds existing user (ID: 1)
6. Navigate to /home
7. Backend loads:
   - Preferences: action, sci-fi, Netflix, 90-150 min
   - Feedback: 1 like, 1 dislike
8. ML recommender generates recommendations
9. User sees SAME personalized recommendations as before
10. All feedback and watchlist intact
```

---

## 🧠 How the ML Recommender Works

### Architecture

```
User Input (from DB)
    ↓
preferred_genres: ["action", "sci-fi"]
services: ["Netflix"]
runtime_min: 90, runtime_max: 150
liked_movie_ids: [862, 13]
disliked_movie_ids: [11]
    ↓
Build User Profile Vector
    ↓
1. Load movie features for liked movies (TF-IDF + genre vectors)
2. Average them to create user profile
3. Boost profile with preferred genres
    ↓
Compute Similarity
    ↓
cosine_similarity(user_profile, all_movie_features)
    ↓
Filter Results
    ↓
1. Exclude disliked movies
2. Filter by runtime range
3. Filter by preferred genres (if any)
4. Filter by streaming services (if any)
    ↓
Rank & Return Top K
    ↓
20 movies with:
- movie_id, title, year, runtime, overview
- genres, services
- similarity score
- explanation ("Matches your preferred genres: sci-fi • Available on Netflix")
```

### Data Sources

**MovieLens 32M Dataset:**
- 50,000+ movies
- Merged with TMDb metadata
- Preprocessed in `backend/data/movies_merged.csv`

**ML Artifacts:**
- `item_features.npz` - Sparse feature matrix (TF-IDF + genres + numeric)
- `tfidf_vectorizer.pkl` - Fitted TfidfVectorizer
- `movies_meta.json` - Movie metadata (title, year, genres, etc.)

**User Data (SQLite):**
- Preferences (genres, services, runtime)
- Feedback (likes, dislikes, not interested)
- Watchlist (saved movies)

---

## 🧪 Testing the Integration

### Test 1: Cold Start (New User, No Preferences)
```bash
# Sign in as new user
# Go to /home
# Expected: "Set your preferences to get personalized recommendations"
# Click "Set Preferences"
# Select some genres and services
# Save
# Return to /home
# Expected: See personalized recommendations
```

### Test 2: Warm Start (Existing User with Preferences)
```bash
# Sign in as existing user
# Go to /home
# Expected: Immediately see personalized recommendations
# Check console: "✓ Loaded 20 personalized recommendations"
# Check backend logs: See genres, services, runtime being loaded
```

### Test 3: Feedback Improves Recommendations
```bash
# Like 3 sci-fi movies (👍)
# Refresh /home
# Expected: More sci-fi recommendations appear
# Expected: Recommendations similar to liked movies
```

### Test 4: Persistence Across Sessions
```bash
# Set preferences: action, comedy, Netflix, 90-150 min
# Like 2 movies
# Add 3 to watchlist
# Sign out
# Sign in with same email
# Go to /home
# Expected: Same personalized recommendations
# Go to /profile
# Expected: Preferences still there
# Go to /watchlist
# Expected: Watchlist still there
```

### Test 5: Database Verification
```bash
cd backend
sqlite3 cinematch.db

-- Check user
SELECT * FROM users WHERE email='jane@example.com';

-- Check preferences
SELECT * FROM user_preferences WHERE user_id=1;

-- Check feedback
SELECT * FROM user_feedback WHERE user_id=1;

-- Check watchlist
SELECT * FROM watchlist_items WHERE user_id=1;
```

---

## 📁 Files Modified

### Backend

#### 1. **`backend/app/api/routes_recs.py`** ⭐ Major Update
- **Added:** `GET /api/recommendations` endpoint
- **Functionality:**
  - Uses `get_current_user()` dependency (reads `X-User-Id`)
  - Loads `UserPreferences` from database
  - Loads `UserFeedback` from database
  - Builds ML `UserPreferences` object
  - Calls `recommender.recommend(prefs, limit)`
  - Returns personalized recommendations
- **No longer needed:** POST endpoint with preferences in body

#### 2. **`backend/app/models.py`** ✅ Already Complete
- `User` model
- `UserPreferences` model
- `WatchlistItem` model
- `UserFeedback` model

#### 3. **`backend/app/api/routes_auth.py`** ✅ Already Complete
- `POST /auth/identify`

#### 4. **`backend/app/api/routes_preferences.py`** ✅ Already Complete
- `GET /api/preferences/me`
- `PUT /api/preferences/me`

#### 5. **`backend/app/api/routes_watchlist_persistence.py`** ✅ Already Complete
- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist/{movie_id}`
- `POST /api/watchlist/{movie_id}/watched`

#### 6. **`backend/app/api/routes_feedback.py`** ✅ Already Complete
- `POST /api/feedback`

#### 7. **`backend/ml/recommender.py`** ✅ Already Complete
- `CineMatchRecommender` class
- `recommend(prefs, top_k)` method
- Content-based filtering with TF-IDF + cosine similarity
- Loads from ML artifacts

### Frontend

#### 1. **`src/pages/HomePage.jsx`** ⭐ Major Update
- **Removed:** Mock data, hard-coded user
- **Added:**
  - `useAuth()` hook
  - `api.get('/api/recommendations')` call
  - Error handling with retry
  - Empty state with "Set Preferences" button
  - Real user greeting
  - `handleMovieRemoved()` for feedback actions

#### 2. **`src/pages/ProfilePage.jsx`** ✅ Already Complete
- Real user display
- Preferences loading from DB
- Preferences editor

#### 3. **`src/pages/WatchlistPage.jsx`** ✅ Already Complete
- Loads from DB
- Persistence actions

#### 4. **`src/components/MovieCard.jsx`** ✅ Already Complete
- Feedback actions wired up
- Watchlist action wired up

#### 5. **`src/context/AuthContext.jsx`** ✅ Already Complete
- `identifyUser()`
- localStorage persistence

#### 6. **`src/api/client.js`** ✅ Already Complete
- Auto-adds `X-User-Id` header

---

## ✅ Summary

### What Was Completed

1. **Database Persistence** ✅
   - All user data persists in SQLite
   - User preferences, watchlist, feedback stored
   - Movie catalog remains in ML artifacts (not in DB)

2. **Real ML Recommender** ✅
   - Wired into React UI via `GET /api/recommendations`
   - Loads user data from database automatically
   - Generates personalized recommendations
   - Uses MovieLens 32M + TMDb data
   - TF-IDF + genre features + cosine similarity

3. **Frontend Integration** ✅
   - HomePage uses real recommendations (no mock data)
   - ProfilePage loads/saves preferences from/to DB
   - WatchlistPage loads from DB
   - MovieCard sends feedback to DB
   - All components use `AuthContext` for real user

4. **Auth Flow** ✅
   - Email-based user lookup
   - Stable identity (same email = same ID)
   - localStorage persistence
   - Protected routes

### Result

**CineMatch is now a fully functional ML-powered movie recommendation app with:**
- ✅ Personalized recommendations based on user preferences and viewing history
- ✅ Persistent user data across sessions
- ✅ Real content-based filtering with 50,000+ movies
- ✅ Stable user authentication
- ✅ Working watchlist and feedback system

**Ready for demo! 🎉**

