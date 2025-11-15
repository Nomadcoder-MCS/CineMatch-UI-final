# 🎬 Fix: Posters Not Showing

## ✅ Issue Fixed

The problem was that `train_model.py` wasn't saving `poster_path` in the model artifacts. This has been fixed.

## 🔧 What Was Changed

1. **`backend/ml/train_model.py`**
   - Now includes `poster_path` and `backdrop_path` in saved artifacts
   - Handles missing poster_path gracefully

2. **`backend/ml/recommender.py`**
   - Updated `build_poster_url()` to handle NaN values from JSON
   - Now properly converts poster_path to full TMDb URLs

3. **Model Retrained**
   - Artifacts now include `poster_path` for 97% of movies

## 🚀 To Fix Posters in Your App

**The backend server needs to be restarted to load the new artifacts:**

```bash
# 1. Stop the current backend server (if running)
# Press Ctrl+C in the terminal where uvicorn is running

# 2. Restart the backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**That's it!** The backend will now:
- Load artifacts with `poster_path`
- Build full TMDb poster URLs
- Return `poster_url` in API responses

## 🧪 Verify It Works

```bash
# Test the API (note: quote the URL for zsh)
curl -H "X-User-Id: 1" "http://localhost:8000/api/recommendations?limit=3" | \
  jq '.recommendations[] | {title, poster_url}'
```

**Expected:** Most movies should have `poster_url` like:
```json
{
  "title": "Toy Story",
  "poster_url": "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg"
}
```

## 📊 Coverage

- **97% of movies** have poster_path in TMDb metadata
- **~3% of movies** will show the purple placeholder (movies without TMDb posters)

## 🐛 If Posters Still Don't Show

1. **Check browser console** for image load errors
2. **Verify API response** has `poster_url` (not null)
3. **Check CORS** - TMDb images should load from `image.tmdb.org`
4. **Hard refresh** the frontend: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

✅ **After restarting the backend, posters should appear!**

