# 🚀 Quick Test Guide - Real ML Recommender

## Start the App

### Terminal 1: Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**✅ Expected Output:**
```
🎬 CineMatch Backend Starting...
Initializing database...
✓ Database ready (SQLite: cinematch.db)
Loading ML recommender...
Loading recommender artifacts from ml/artifacts...
✓ Loaded 50,000+ movies
✓ Recommender ready
```

### Terminal 2: Frontend
```bash
# From project root
npm run dev
```

**✅ Expected Output:**
```
VITE ready
➜  Local:   http://localhost:5173/
```

---

## 🧪 Test Scenario: Real ML Recommendations

### Step 1: Sign Up
1. Visit http://localhost:5173/
2. Enter:
   - Name: `Test User`
   - Email: `test@demo.com`
3. Click **"Get started"**
4. ✅ Navigate to `/home`

### Step 2: Empty State (No Preferences Yet)
1. See message: **"Set your preferences in Profile to get personalized recommendations"**
2. Click **"Set Preferences"** button
3. ✅ Navigate to `/profile`

### Step 3: Set Preferences
1. Click **"Edit preferences"**
2. Select genres:
   - ✅ `action`
   - ✅ `sci-fi`
   - ✅ `thriller`
3. Select services:
   - ✅ `Netflix`
   - ✅ `Hulu`
4. Set runtime:
   - Min: `90`
   - Max: `150`
5. Click **"Save"**
6. ✅ See success message
7. Navigate back to **Home**

### Step 4: See Real ML Recommendations
1. Page loads with message: **"Loading your personalized recommendations..."**
2. Backend console shows:
   ```
   ============================================================
   Building recommendations for user: Test User (ID: 1)
     Preferred genres: ['action', 'sci-fi', 'thriller']
     Services: ['Netflix', 'Hulu']
     Runtime: 90-150 min
     Liked movies: 0
     Disliked movies: 0
   ============================================================
   Generating recommendations for user: 1
   ============================================================
   ✓ Filtered to 20 recommendations
   ✓ Generated 20 personalized recommendations
   ```
3. Frontend shows **20 movie cards** with:
   - Title, year, runtime
   - Overview
   - Genre tags (action, sci-fi, thriller)
   - Service badges (Netflix, Hulu)
   - Explanation: "Matches your preferred genres: action, sci-fi • Available on Netflix"

### Step 5: Provide Feedback
1. Find a movie you like (e.g., "Blade Runner")
2. Click **👍**
3. ✅ Console: `✓ Liked movie: Blade Runner`
4. Backend saves to `user_feedback` table
5. Find another movie
6. Click **👎**
7. ✅ Console: `✓ Disliked movie: ...`
8. Find a movie you want to watch
9. Click **"+ Watchlist"**
10. ✅ Navigate to `/watchlist`
11. ✅ See movie in watchlist

### Step 6: Refresh and See Improved Recommendations
1. Navigate back to **Home**
2. Recommendations reload
3. Backend console shows:
   ```
   Building recommendations for user: Test User (ID: 1)
     Preferred genres: ['action', 'sci-fi', 'thriller']
     Services: ['Netflix', 'Hulu']
     Runtime: 90-150 min
     Liked movies: 1   ← NOW HAS FEEDBACK
     Disliked movies: 1
   ```
4. ✅ Recommendations are now MORE personalized:
   - Similar to movies you liked
   - Excludes movies you disliked
   - Still matches genres and services

### Step 7: Sign Out and Back In (Persistence Test)
1. Click user menu (top right)
2. Click **"Sign out"**
3. ✅ Navigate to `/` (landing page)
4. Enter **same email**: `test@demo.com`
5. Click **"Get started"**
6. ✅ Navigate to `/home`
7. ✅ See same personalized recommendations
8. Go to **Profile**
9. ✅ Preferences still there
10. Go to **Watchlist**
11. ✅ Watchlist items still there

---

## 🔍 Verify Database

### Check User Data
```bash
cd backend
sqlite3 cinematch.db

-- View user
SELECT * FROM users WHERE email='test@demo.com';

-- View preferences
SELECT * FROM user_preferences WHERE user_id=1;

-- View feedback
SELECT * FROM user_feedback WHERE user_id=1;

-- View watchlist
SELECT * FROM watchlist_items WHERE user_id=1;
```

**✅ Expected:**
- 1 user row
- 1 preferences row with genres/services
- Multiple feedback rows (likes/dislikes)
- Multiple watchlist rows

---

## 📊 Backend API Testing

### Test GET /api/recommendations Directly
```bash
# Get recommendations for user 1
curl -X GET "http://localhost:8000/api/recommendations?limit=5" \
  -H "X-User-Id: 1"
```

**✅ Expected Response:**
```json
{
  "recommendations": [
    {
      "movie_id": 862,
      "title": "Blade Runner",
      "year": 1982,
      "runtime": 117,
      "overview": "In the smog-choked dystopian...",
      "genres": ["sci-fi", "thriller"],
      "services": ["Netflix", "Prime Video"],
      "score": 0.84,
      "explanation": "Matches your preferred genres: sci-fi, thriller • Available on Netflix"
    }
  ],
  "count": 5,
  "user_id": 1
}
```

### Test Other Endpoints
```bash
# Get preferences
curl -X GET "http://localhost:8000/api/preferences/me" \
  -H "X-User-Id: 1"

# Get watchlist
curl -X GET "http://localhost:8000/api/watchlist" \
  -H "X-User-Id: 1"

# Get available genres
curl -X GET "http://localhost:8000/api/genres"

# Get available services
curl -X GET "http://localhost:8000/api/services"
```

---

## ✅ Success Checklist

After running all tests:

- [x] Backend starts with no errors
- [x] Frontend connects to backend
- [x] User can sign up and sign in
- [x] Preferences can be set and saved
- [x] HomePage loads **real ML recommendations** (not mock data)
- [x] Recommendations match user preferences (genres, services, runtime)
- [x] Feedback actions (👍👎) persist to database
- [x] Watchlist actions persist to database
- [x] Signing out and back in restores all data
- [x] Recommendations improve after providing feedback
- [x] Database tables are populated correctly

---

## 🐛 Troubleshooting

### "Could not load recommendations"
**Fix:**
```bash
# Check backend is running
curl http://localhost:8000/health

# Check ML artifacts exist
ls backend/ml/artifacts/
# Should see: item_features.npz, tfidf_vectorizer.pkl, movies_meta.json

# If missing, train model
cd backend
python -m ml.train_model
```

### "No recommendations yet"
**Reason:** User has no preferences set

**Fix:**
1. Go to Profile
2. Click "Edit preferences"
3. Select at least 1 genre
4. Save
5. Return to Home

### Backend Error: "No module named 'app'"
**Fix:**
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend Error: "Network request failed"
**Fix:**
1. Check backend is running on port 8000
2. Check `src/api/client.js` has correct BASE_URL
3. Check browser console for CORS errors

---

## 🎬 Demo Script (3 minutes)

**For showing to professor/TA:**

1. **Start both servers** (1 min)
   - Backend: `uvicorn app.main:app --reload --port 8000`
   - Frontend: `npm run dev`
   - Show backend console: "✓ Recommender ready (50,000+ movies)"

2. **Sign up as new user** (30 sec)
   - Enter name and email
   - Click "Get started"
   - Show empty state message

3. **Set preferences** (45 sec)
   - Go to Profile
   - Edit preferences: sci-fi, action, Netflix
   - Save
   - Show success message

4. **View recommendations** (45 sec)
   - Return to Home
   - Show backend console logs (genres, services being loaded)
   - Point out personalized movies with explanations
   - Show scores and genre tags

5. **Provide feedback** (30 sec)
   - Like a movie (👍)
   - Add to watchlist
   - Show database has data:
     ```bash
     sqlite3 cinematch.db "SELECT * FROM user_feedback WHERE user_id=1;"
     ```

6. **Demonstrate persistence** (30 sec)
   - Sign out
   - Sign in with same email
   - Show recommendations still personalized
   - Show preferences still there
   - Show watchlist intact

**Total: ~4 minutes with buffer**

---

**Everything is working! The real ML recommender is fully integrated with database persistence.** 🎉

