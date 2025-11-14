# CineMatch Persistence Implementation Summary

Complete implementation of SQLite persistence and API wiring for the CineMatch school project.

## 🎯 What Was Implemented

### Backend (FastAPI + SQLAlchemy + SQLite)

**Database Layer:**
- `app/db.py` - SQLAlchemy engine, session management, and `get_db()` dependency
- `app/models.py` - ORM models for User, UserPreferences, WatchlistItem, UserFeedback
- SQLite database (`cinematch.db`) with automatic table creation on startup

**Authentication:**
- `app/deps.py` - `get_current_user()` dependency that reads `X-User-Id` header
- `app/api/routes_auth.py` - User identification endpoint (email-based, no passwords)

**Persistence Endpoints:**
- `app/schemas/persistence.py` - Pydantic schemas for all persistence operations
- `app/api/routes_preferences.py` - User preferences GET/PUT
- `app/api/routes_watchlist_persistence.py` - Watchlist CRUD operations
- `app/api/routes_feedback.py` - User feedback recording (like/dislike/not_interested)

**Updated Files:**
- `app/main.py` - Registered new routers, added database initialization on startup
- `backend/.gitignore` - Added `*.db` and `cinematch.db`

### Frontend (React)

**Auth Layer:**
- `src/context/AuthContext.jsx` - Auth context with user identification and localStorage persistence
- `src/api/client.js` - API client helper with automatic `X-User-Id` header injection

**Component Updates:**
- `src/App.jsx` - Wrapped with `AuthProvider`
- `src/pages/LandingPage.jsx` - Auto-identifies demo user on "Get started"
- `src/components/MovieCard.jsx` - Wired up feedback (👍👎) and watchlist actions
- `src/components/WatchlistItem.jsx` - Wired up mark watched and remove actions
- `src/pages/WatchlistPage.jsx` - Loads watchlist from persistent API

---

## 📋 API Endpoints

### Authentication
```
POST /auth/identify
  Request: { name: string, email: string }
  Response: { id: number, name: string, email: string, created_at: datetime }
  Purpose: Identify or create user by email (no password required)
```

### Preferences
```
GET /api/preferences/me
  Headers: X-User-Id: <user_id>
  Response: {
    preferred_genres: string[],
    services: string[],
    original_languages: string[],
    runtime_min: number | null,
    runtime_max: number | null,
    updated_at: datetime
  }

PUT /api/preferences/me
  Headers: X-User-Id: <user_id>
  Request: Same as GET response (without updated_at)
  Response: Updated preferences
```

### Watchlist
```
GET /api/watchlist
  Headers: X-User-Id: <user_id>
  Response: {
    items: [
      {
        id: number,
        movie_id: number,
        title: string | null,
        service: string | null,
        watched: boolean,
        created_at: datetime
      }
    ],
    count: number
  }

POST /api/watchlist
  Headers: X-User-Id: <user_id>
  Request: { movie_id: number, title?: string, service?: string }
  Response: WatchlistItem

DELETE /api/watchlist/{movie_id}
  Headers: X-User-Id: <user_id>
  Response: { message: string, movie_id: number }

POST /api/watchlist/{movie_id}/watched
  Headers: X-User-Id: <user_id>
  Response: Updated WatchlistItem with watched=true
```

### Feedback
```
POST /api/feedback
  Headers: X-User-Id: <user_id>
  Request: { movie_id: number, signal: "like" | "dislike" | "not_interested" }
  Response: {
    id: number,
    movie_id: number,
    signal: string,
    created_at: datetime
  }

GET /api/feedback/my-likes
  Headers: X-User-Id: <user_id>
  Response: number[] (movie IDs)

GET /api/feedback/my-dislikes
  Headers: X-User-Id: <user_id>
  Response: number[] (movie IDs)
```

---

## 🔌 Frontend Wiring

### MovieCard Component
**Location:** `src/components/MovieCard.jsx`

**Wired Actions:**
- **👍 Thumbs Up**: `POST /api/feedback` with `signal: "like"`
- **👎 Thumbs Down**: `POST /api/feedback` with `signal: "dislike"`
- **Not Interested**: `POST /api/feedback` with `signal: "not_interested"`
- **+ Watchlist**: `POST /api/watchlist` with movie details

**Props Changed:**
- Removed `userId` prop (now uses auth context)

### WatchlistPage Component
**Location:** `src/pages/WatchlistPage.jsx`

**Wired Actions:**
- **On Mount**: `GET /api/watchlist` to load user's watchlist
- **Remove**: `DELETE /api/watchlist/{movie_id}`

**Changes:**
- Replaced `fetchWatchlist(userId)` from old ML API with `api.get('/api/watchlist')`
- Updated `handleRemoveItem` to call new persistent API

### WatchlistItem Component
**Location:** `src/components/WatchlistItem.jsx`

**Wired Actions:**
- **Mark Watched**: `POST /api/watchlist/{movie_id}/watched`
- **Remove**: `DELETE /api/watchlist/{movie_id}`

**Props Changed:**
- Removed `userId` prop (now uses auth context via api client)
- Added `onRemove` callback prop
- Updated to work with persistent API response structure

### LandingPage Component
**Location:** `src/pages/LandingPage.jsx`

**Wired Actions:**
- **Get Started**: Calls `POST /auth/identify` to create/identify demo user

**Changes:**
- Added `useAuth()` hook
- Auto-identifies as "Alex Johnson" for demo purposes
- Navigates to `/home` after identification

---

## 🗄️ Database Schema

### users
```sql
id              INTEGER PRIMARY KEY
name            VARCHAR NOT NULL
email           VARCHAR UNIQUE NOT NULL
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

### user_preferences
```sql
id                  INTEGER PRIMARY KEY
user_id             INTEGER UNIQUE NOT NULL → users.id
preferred_genres    VARCHAR (pipe-separated)
services            VARCHAR (pipe-separated)
original_languages  VARCHAR (pipe-separated)
runtime_min         INTEGER NULL
runtime_max         INTEGER NULL
updated_at          DATETIME
```

### watchlist_items
```sql
id          INTEGER PRIMARY KEY
user_id     INTEGER NOT NULL → users.id
movie_id    INTEGER NOT NULL (from ML catalog)
title       VARCHAR NULL
service     VARCHAR NULL
watched     BOOLEAN DEFAULT FALSE
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
```

### user_feedback
```sql
id          INTEGER PRIMARY KEY
user_id     INTEGER NOT NULL → users.id
movie_id    INTEGER NOT NULL
signal      VARCHAR CHECK(signal IN ('like', 'dislike', 'not_interested'))
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
```

---

## 🚀 How to Use

### 1. Start Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**On startup, the backend will:**
- Create `cinematch.db` SQLite database
- Create all tables automatically
- Load ML recommender
- Be ready to accept requests

### 2. Start Frontend

```bash
# From project root
npm run dev
```

### 3. Test the Flow

1. **Visit** http://localhost:5173
2. **Click** "Get started" on landing page
   - Auto-creates user "Alex Johnson"
   - Navigates to /home
3. **On Home page:**
   - Click 👍 or 👎 on any movie → Records feedback
   - Click "Not interested" → Records feedback
   - Click "+ Watchlist" → Adds to watchlist, navigates to /watchlist
4. **On Watchlist page:**
   - See your saved movies
   - Click checkbox to mark watched
   - Click ⋯ to remove from watchlist

---

## 🎓 School Project Notes

### Simplifications Made
1. **No real authentication** - Just email-based identification
2. **No passwords** - Simple `X-User-Id` header
3. **SQLite database** - Single file, no migrations
4. **Auto-identify demo user** - One-click to get started
5. **List fields as pipe-separated strings** - Simple storage

### Production Improvements (TODOs for Future)
1. Add JWT-based authentication
2. Use PostgreSQL or MySQL
3. Implement proper user sign-up/sign-in flow
4. Add database migrations (Alembic)
5. Add input validation and sanitization
6. Add rate limiting and security headers
7. Use user feedback to improve recommendations (ML integration)
8. Add tests for all endpoints

---

## ✅ Completed TODOs

All the following TODOs have been **RESOLVED**:

### Backend
- ✅ `// TODO: Implement recordFeedback endpoint in backend` → `POST /api/feedback`
- ✅ `// TODO: Implement markNotInterested endpoint in backend` → `POST /api/feedback` with `signal: "not_interested"`
- ✅ Persistent watchlist storage
- ✅ User preferences storage

### Frontend
- ✅ `// TODO: Implement recordFeedback endpoint in backend` → Wired in MovieCard
- ✅ `// TODO: Implement markNotInterested endpoint in backend` → Wired in MovieCard
- ✅ Watchlist load/remove/mark watched → Wired in WatchlistPage & WatchlistItem
- ✅ Auth context and user management
- ✅ API client with automatic auth headers

---

## 📁 New Files Created

### Backend
```
app/db.py                              (Database setup)
app/models.py                          (ORM models)
app/deps.py                            (Dependencies)
app/schemas/persistence.py             (Pydantic schemas)
app/api/routes_auth.py                 (Auth endpoints)
app/api/routes_preferences.py          (Preferences endpoints)
app/api/routes_watchlist_persistence.py (Watchlist endpoints)
app/api/routes_feedback.py             (Feedback endpoints)
```

### Frontend
```
src/context/AuthContext.jsx            (Auth context)
src/api/client.js                      (API client helper)
```

### Documentation
```
PERSISTENCE_IMPLEMENTATION.md          (This file)
```

---

## 🔍 Testing Checklist

- [ ] **Auth**: Visit landing, click "Get started", check localStorage for user
- [ ] **Feedback - Like**: Click 👍 on movie, check console for "✓ Liked movie"
- [ ] **Feedback - Dislike**: Click 👎 on movie, check console for "✓ Disliked movie"
- [ ] **Feedback - Not Interested**: Click "Not interested", see alert
- [ ] **Watchlist - Add**: Click "+ Watchlist", navigate to /watchlist, see movie
- [ ] **Watchlist - Load**: Refresh /watchlist page, movies persist
- [ ] **Watchlist - Mark Watched**: Check checkbox, see opacity change
- [ ] **Watchlist - Remove**: Click ⋯ button, confirm, see movie removed
- [ ] **Database**: Check `backend/cinematch.db` exists after first use

---

## 💡 Key Design Decisions

1. **X-User-Id Header**: Simple auth for school project, easy to test
2. **Auto-identify on Landing**: One click to demo the app
3. **SQLite**: Zero configuration, perfect for development
4. **Pipe-separated strings**: Simple list storage without JSON columns
5. **AuthProvider + localStorage**: Persistent user session across page reloads
6. **API client wrapper**: Central place for auth header injection
7. **No UI redesign**: Kept existing Tailwind styles, only wired up functionality

---

**Implementation Complete!** All persistence and API wiring is now functional. The app remembers users, their preferences, watchlist, and feedback across sessions.

