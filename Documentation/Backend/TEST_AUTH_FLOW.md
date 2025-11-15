# 🧪 Testing the Complete Auth & Persistence Flow

## Quick Start

### 1. Start Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**✅ Should see:**
```
🎬 CineMatch Backend Starting...
Initializing database...
✓ Database ready (SQLite: cinematch.db)
Loading ML recommender...
✓ Recommender ready (50,000+ movies)
```

### 2. Start Frontend
```bash
# In another terminal, from project root
npm run dev
```

**✅ Should see:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 🎯 Test Scenarios

### Scenario 1: New User Sign Up
1. Visit http://localhost:5173/
2. See landing page with **name/email form**
3. Enter:
   - Name: `Test User`
   - Email: `test@cinematch.com`
4. Click **"Get started"**
5. **✅ Expected:** Navigate to `/home` with recommendations

**Verify Backend:**
```bash
cd backend
sqlite3 cinematch.db "SELECT * FROM users WHERE email='test@cinematch.com';"
```
Should see a user with ID (e.g., `1|Test User|test@cinematch.com|...`)

---

### Scenario 2: Set Preferences
1. Sign in as `test@cinematch.com`
2. Click profile icon (top right) → **Profile**
3. Click **"Edit preferences"**
4. Select:
   - Genres: `action`, `sci-fi`, `comedy`
   - Services: `Netflix`, `Hulu`
   - Runtime: Min `90`, Max `150`
5. Click **"Save"**
6. **✅ Expected:** Success message, preferences display updated

**Verify Backend:**
```bash
sqlite3 cinematch.db "SELECT * FROM user_preferences WHERE user_id=1;"
```
Should see: `1|1|action|sci-fi|comedy|Netflix|Hulu|90|150|...`

---

### Scenario 3: Add to Watchlist
1. Go to **Home** (recommendations page)
2. Find a movie you like
3. Click **"+ Watchlist"**
4. **✅ Expected:** Alert "Added to watchlist", navigate to `/watchlist`
5. **✅ Expected:** Movie appears in watchlist

**Verify Backend:**
```bash
sqlite3 cinematch.db "SELECT * FROM watchlist_items WHERE user_id=1;"
```
Should see rows like: `1|1|862|Blade Runner|Netflix|0|...`

---

### Scenario 4: Like/Dislike Movies
1. Go to **Home**
2. Click **👍** on a movie (e.g., "The Matrix")
3. **✅ Expected:** Console log "✓ Liked movie: The Matrix"
4. Click **👎** on another movie
5. **✅ Expected:** Console log "✓ Disliked movie: ..."
6. Click **"Not interested"** on another
7. **✅ Expected:** Alert "We'll show you fewer movies like this"

**Verify Backend:**
```bash
sqlite3 cinematch.db "SELECT * FROM user_feedback WHERE user_id=1;"
```
Should see rows like:
```
1|1|13|like|...
2|1|550|dislike|...
3|1|27|not_interested|...
```

---

### Scenario 5: Sign Out
1. Click user menu (top right)
2. Click **"Sign out"**
3. **✅ Expected:** Navigate to `/` (landing page)
4. **✅ Expected:** Name/email form visible again

**Verify localStorage:**
Open browser DevTools → Application → Local Storage → http://localhost:5173
- **✅ Expected:** `cinematch_user` should be **deleted**

---

### Scenario 6: Sign Back In (Same Email) ⭐ KEY TEST
1. On landing page, enter:
   - Name: `Test User` (or any name, doesn't matter)
   - Email: `test@cinematch.com` ← **SAME EMAIL as before**
2. Click **"Get started"**
3. **✅ Expected:** Navigate to `/home`

**Check Profile:**
1. Go to Profile
2. **✅ Expected:** Shows `Test User` and `test@cinematch.com`
3. **✅ Expected:** Preferences restored (action, sci-fi, comedy / Netflix, Hulu / 90-150 min)

**Check Watchlist:**
1. Go to Watchlist
2. **✅ Expected:** All previously added movies still there

**Verify Backend:**
```bash
sqlite3 cinematch.db "SELECT COUNT(*) FROM users WHERE email='test@cinematch.com';"
```
**✅ Expected:** `1` (only ONE user with this email, not multiple)

---

### Scenario 7: Different User
1. Sign out
2. On landing page, enter:
   - Name: `Jane Smith`
   - Email: `jane@cinematch.com` ← **DIFFERENT EMAIL**
3. Click **"Get started"**
4. Go to Profile
5. **✅ Expected:** Shows `Jane Smith` and `jane@cinematch.com`
6. **✅ Expected:** Preferences are **empty** (new user)
7. Go to Watchlist
8. **✅ Expected:** Watchlist is **empty** (new user)

**Verify Backend:**
```bash
sqlite3 cinematch.db "SELECT * FROM users;"
```
**✅ Expected:** Two rows (one for `test@cinematch.com`, one for `jane@cinematch.com`)

---

### Scenario 8: Protected Routes
1. Sign out (or open incognito window)
2. Try to visit http://localhost:5173/home
3. **✅ Expected:** Redirected to `/` (landing page)
4. Try to visit http://localhost:5173/watchlist
5. **✅ Expected:** Redirected to `/`
6. Try to visit http://localhost:5173/profile
7. **✅ Expected:** Redirected to `/`

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -ti:8000 | xargs kill -9

# Verify artifacts exist
ls backend/ml/artifacts/
# Should see: item_features.npz, tfidf_vectorizer.pkl, movies_meta.json

# If missing, train model
cd backend
python -m ml.train_model
```

### Frontend won't connect to backend
```bash
# Check VITE_API_BASE_URL
cat .env.local
# Should have: VITE_API_BASE_URL=http://localhost:8000

# Or check src/api/client.js
# Should have: const BASE_URL = "http://localhost:8000";
```

### User not persisting after login
1. Open browser DevTools → Application → Local Storage
2. Check for `cinematch_user` key
3. If missing, check AuthContext is wrapping App in `src/App.jsx`
4. Check `identifyUser()` is being called in `LandingPage.jsx`

### Preferences not saving
1. Check backend logs for errors
2. Open DevTools → Network tab
3. Submit preferences
4. Check `PUT /api/preferences/me` request
5. Should see `X-User-Id` header
6. Should see request body with genres/services

### Watchlist not loading
1. Check backend logs
2. DevTools → Network → `GET /api/watchlist`
3. Should return `{ "items": [...] }` or `{ "items": [] }`
4. Check `X-User-Id` header is present

---

## 📊 Database Inspection

### View all users
```bash
cd backend
sqlite3 cinematch.db "SELECT * FROM users;"
```

### View preferences for user ID 1
```bash
sqlite3 cinematch.db "SELECT * FROM user_preferences WHERE user_id=1;"
```

### View watchlist for user ID 1
```bash
sqlite3 cinematch.db "SELECT * FROM watchlist_items WHERE user_id=1;"
```

### View feedback for user ID 1
```bash
sqlite3 cinematch.db "SELECT * FROM user_feedback WHERE user_id=1;"
```

### Reset database (start fresh)
```bash
cd backend
rm cinematch.db
# Restart backend, it will recreate the DB
```

---

## ✅ Success Checklist

After running all scenarios, you should have:

- [x] **Stable Identity**: Same email → Same user ID every time
- [x] **Profile Shows Real User**: Name and email from backend
- [x] **Preferences Persist**: Genre/service selections saved and restored
- [x] **Watchlist Persists**: Movies stay in watchlist after logout/login
- [x] **Feedback Persists**: Likes/dislikes stored in database
- [x] **Sign Out Works**: User cleared, redirected to landing
- [x] **Protected Routes**: Can't access /home without login
- [x] **Multiple Users**: Each user has independent data

---

## 🎬 Demo Flow (Show to Professor/TA)

1. **Start both servers**
2. **Sign up** as `demo@cinematch.com`
3. **Set preferences**: Select 3 genres, 2 services
4. **Like 2 movies** (👍)
5. **Add 3 movies to watchlist**
6. **Sign out**
7. **Sign back in** with same email
8. **Show Profile** → Preferences restored
9. **Show Watchlist** → Movies still there
10. **Show database** in terminal → All data persisted

**Total demo time: ~3 minutes**

---

**Everything should work perfectly! If any test fails, check the troubleshooting section above.**

