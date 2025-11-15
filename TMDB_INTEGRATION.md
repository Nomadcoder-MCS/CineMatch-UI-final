# 🎬 TMDb Integration: Movie Posters & Synopses

## Overview

This document explains the complete integration of TMDb (The Movie Database) metadata to display real movie posters and synopses in the CineMatch app.

---

## 📊 Data Flow

```
TMDb API
   ↓ (fetch_tmdb_metadata.py)
raw/tmdb/tmdb_metadata.csv
   ↓ (preprocess_catalog.py)
data/movies_merged.csv
   ↓ (train_model.py)
ml/artifacts/movies_meta.json
   ↓ (recommender.py)
/api/recommendations
   ↓
React Frontend (MovieCard)
```

---

## 🔧 Implementation

### 1. Backend: Fetch TMDb Metadata

**File:** `backend/scripts/fetch_tmdb_metadata.py`

**Changes:**
- Added `poster_path` field to TMDb fetch
- Added `backdrop_path` field (optional)

**Key Fields Fetched:**
- `tmdb_id` - TMDb movie ID
- `title` - Movie title
- `release_date` - Release date
- `runtime` - Runtime in minutes
- `overview` - **Movie synopsis/description**
- `poster_path` - **Relative path to poster image**
- `backdrop_path` - Backdrop image path
- `genres` - Pipe-separated genres
- `vote_average`, `vote_count` - Ratings
- `popularity` - TMDb popularity score
- `keywords`, `cast_top`, `director` - Additional metadata

**Usage:**
```bash
cd backend
python -m scripts.fetch_tmdb_metadata
```

**Output:** `backend/raw/tmdb/tmdb_metadata.csv`

**Notes:**
- Requires `TMDB_BEARER_TOKEN` in `.env`
- Handles rate limiting (429) and retries
- Fetches data for all MovieLens tmdbIds

---

### 2. Backend: Preprocessing

**File:** `backend/ml/preprocess_catalog.py`

**Changes:**
- Added `poster_path` and `backdrop_path` to `keep_cols`
- These fields are now preserved in the final merged catalog

**Output Columns:**
```python
[
    "movieId",      # MovieLens ID
    "tmdbId",       # TMDb ID  
    "imdbId",       # IMDb ID
    "title",        # Movie title
    "year",         # Release year
    "genres",       # Pipe-separated genres
    "overview",     # ✅ Movie synopsis
    "runtime",      # Runtime in minutes
    "popularity",   # TMDb popularity
    "vote_count",   # Number of votes
    "vote_average", # Average rating
    "poster_path",  # ✅ TMDb poster path
    "backdrop_path",# Backdrop path
    "keywords",     # Keywords
    "cast_top",     # Top 3 cast members
    "director"      # Director name
]
```

**Usage:**
```bash
cd backend
python -m ml.preprocess_catalog
```

**Output:** `backend/data/movies_merged.csv`

---

### 3. Backend: Recommender

**File:** `backend/ml/recommender.py`

**Changes:**

#### Added TMDb Configuration
```python
class CineMatchRecommender:
    # TMDb image base URL
    TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/"
    POSTER_SIZE = "w500"  # Options: w92, w154, w185, w342, w500, w780, original
```

#### Added Poster URL Builder
```python
def build_poster_url(self, poster_path: Optional[str]) -> Optional[str]:
    """
    Build full TMDb poster URL from poster_path
    
    Args:
        poster_path: TMDb poster path (e.g., "/abc123.jpg") or None
    
    Returns:
        Full URL (e.g., "https://image.tmdb.org/t/p/w500/abc123.jpg") or None
    """
    if not poster_path or pd.isna(poster_path):
        return None
    
    # poster_path should start with '/', but handle cases where it doesn't
    if not poster_path.startswith('/'):
        poster_path = '/' + poster_path
    
    return f"{self.TMDB_IMAGE_BASE}{self.POSTER_SIZE}{poster_path}"
```

#### Updated Response Format
The `recommend()` method now returns:
```python
{
    "movie_id": 123,
    "title": "The Shawshank Redemption",
    "year": 1994,
    "runtime": 142,
    "overview": "Two imprisoned men bond over...",  # ✅ Synopsis
    "genres": ["drama", "crime"],
    "services": ["Netflix", "Hulu"],
    "poster_url": "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",  # ✅ Full URL
    "poster_path": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",  # Raw path for debugging
    "score": 0.95,
    "explanation": "Because you liked..."
}
```

---

### 4. Frontend: MovieCard Component

**File:** `src/components/MovieCard.jsx`

**Changes:**

#### Field Mapping
```javascript
// Use poster_url from API (camelCase or snake_case)
const posterUrl = movie.poster_url || movie.posterUrl;

// Use overview from API (fallback to synopsis for backward compatibility)
const synopsis = movie.overview || movie.synopsis || "No description available.";
```

#### Poster Display with Fallback
```javascript
{posterUrl ? (
  <img
    src={posterUrl}
    alt={`${movie.title} poster`}
    className="w-32 h-48 object-cover rounded-xl"
    onError={(e) => {
      // Fallback to placeholder if image fails to load
      e.target.style.display = 'none';
      e.target.nextSibling.style.display = 'flex';
    }}
  />
) : null}
<div 
  className="w-32 h-48 bg-brand-purple rounded-xl flex-col items-center justify-center text-white"
  style={{ display: posterUrl ? 'none' : 'flex' }}
>
  <div className="text-3xl font-bold mb-2">{getInitials(movie.title)}</div>
  <div className="text-xs text-center px-2">No Poster</div>
</div>
```

#### Synopsis Display
```javascript
<p className="text-sm text-brand-text-body mb-4 line-clamp-3">
  {synopsis}
</p>
```

**Fallback Behavior:**
1. If `poster_url` is null/undefined → Show purple placeholder with movie initials
2. If `poster_url` exists but image fails to load → Show same placeholder
3. If `overview` is missing → Show "No description available."

---

## 📦 Data Structures

### TMDb Metadata CSV
**Path:** `backend/raw/tmdb/tmdb_metadata.csv`

```csv
tmdb_id,title,release_date,runtime,overview,poster_path,genres,vote_average,...
278,"The Shawshank Redemption",1994-09-23,142,"Two imprisoned men bond...","/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg","drama|crime",8.7,...
```

### Movies Merged CSV
**Path:** `backend/data/movies_merged.csv`

```csv
movieId,tmdbId,title,year,genres,overview,runtime,poster_path,services,...
1,278,"The Shawshank Redemption",1994,"drama|crime","Two imprisoned men...",142,"/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg","Netflix|Hulu",...
```

### Movies Metadata JSON (Artifacts)
**Path:** `backend/ml/artifacts/movies_meta.json`

```json
[
  {
    "movieId": 1,
    "title": "The Shawshank Redemption",
    "year": 1994,
    "runtime": 142,
    "overview": "Two imprisoned men bond over a number of years...",
    "genres": "drama|crime",
    "services": "Netflix|Hulu",
    "poster_path": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
  }
]
```

---

## 🌐 API Response Format

### Endpoint: `GET /api/recommendations`

**Request:**
```bash
curl -H "X-User-Id: 1" http://localhost:8000/api/recommendations?limit=5
```

**Response:**
```json
{
  "recommendations": [
    {
      "movie_id": 1,
      "title": "The Shawshank Redemption",
      "year": 1994,
      "runtime": 142,
      "overview": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      "genres": ["drama", "crime"],
      "services": ["Netflix", "Hulu"],
      "poster_url": "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      "poster_path": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      "score": 0.95,
      "explanation": "Because you liked similar drama movies..."
    }
  ],
  "count": 1,
  "user_id": 1
}
```

**Key Fields:**
- `overview` - Full movie synopsis
- `poster_url` - **Full URL** ready to use in `<img src>`
- `poster_path` - Raw TMDb path (for debugging)

---

## 🖼️ TMDb Image URLs

### URL Structure
```
https://image.tmdb.org/t/p/{size}{poster_path}
```

### Available Sizes
- `w92` - Very small (92px width)
- `w154` - Small (154px width)
- `w185` - Medium-small (185px width)
- `w342` - Medium (342px width)
- `w500` - **Large (500px width)** ← **Current default**
- `w780` - Extra large (780px width)
- `original` - Original resolution

### Examples
```
# Small poster
https://image.tmdb.org/t/p/w185/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg

# Large poster (current)
https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg

# Original
https://image.tmdb.org/t/p/original/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg
```

**To change poster size**, update `POSTER_SIZE` in `backend/ml/recommender.py`:
```python
class CineMatchRecommender:
    POSTER_SIZE = "w342"  # Change to any size above
```

---

## 🚀 Setup & Rebuild Instructions

### Initial Setup (One-time)

1. **Get TMDb API Token**
   - Sign up at https://www.themoviedb.org/
   - Go to Settings → API → Request API Key
   - Copy your "API Read Access Token" (Bearer Token)

2. **Configure Environment**
   ```bash
   cd backend
   echo "TMDB_BEARER_TOKEN=your_token_here" >> .env
   ```

3. **Download MovieLens 32M**
   ```bash
   # Follow instructions in backend/raw/README.md
   cd backend/raw/ml-32m
   # Place movies.csv, links.csv here
   ```

### Fetch TMDb Metadata

```bash
cd backend
source .venv/bin/activate

# Fetch metadata for all MovieLens movies
python -m scripts.fetch_tmdb_metadata

# Output: raw/tmdb/tmdb_metadata.csv
```

**Expected Time:**
- ~60,000 movies × 0.02s = ~20 minutes
- Progress logged every 200 movies

### Rebuild Catalog & Model

```bash
# 1. Preprocess: Merge MovieLens + TMDb
python -m ml.preprocess_catalog
# Output: data/movies_merged.csv

# 2. Train: Build ML features
python -m ml.train_model
# Output: ml/artifacts/item_features.npz, movies_meta.json, etc.

# 3. Restart backend
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Testing

### Backend Testing

```bash
# Check if model loaded poster_path
curl http://localhost:8000/api/movies/1 | jq .poster_url
# Should return: "https://image.tmdb.org/t/p/w500/..."

# Get recommendations and check poster URLs
curl -H "X-User-Id: 1" http://localhost:8000/api/recommendations?limit=3 | jq '.recommendations[0]'
# Should include poster_url and overview fields
```

### Frontend Testing

1. **Sign in** to the app
2. **Navigate to Home** - Recommendations should show:
   - ✅ Real movie posters (not broken images)
   - ✅ Movie synopses (not empty text)
   - ✅ Purple placeholder for movies without posters
3. **Check Network Tab** - `poster_url` should be full URLs starting with `https://image.tmdb.org/...`

### Visual Checks

**What you should see:**
- Movie posters load correctly
- Synopses display under titles (2-3 lines)
- For movies without posters: Purple box with initials

**What you should NOT see:**
- Broken image icons (🖼️❌)
- Empty synopsis areas
- 404 errors for poster images

---

## 📁 Files Modified

### Backend
1. ✅ `backend/scripts/fetch_tmdb_metadata.py` - Added `poster_path`, `backdrop_path`
2. ✅ `backend/ml/preprocess_catalog.py` - Keep poster fields in merged data
3. ✅ `backend/ml/recommender.py` - Build poster URLs, include in responses
4. ✅ `backend/ml/train_model.py` - (No changes, uses merged data)
5. ✅ `backend/app/api/routes_recs.py` - (No changes, passes through recommender data)

### Frontend
1. ✅ `src/components/MovieCard.jsx` - Display posters and synopses with fallbacks

---

## 🐛 Troubleshooting

### Posters Not Showing

**Issue:** Broken images in frontend

**Checks:**
1. **TMDb data fetched?**
   ```bash
   ls -lh backend/raw/tmdb/tmdb_metadata.csv
   # Should exist and be ~10-50 MB
   ```

2. **Model rebuilt?**
   ```bash
   cat backend/ml/artifacts/movies_meta.json | jq '.[0].poster_path'
   # Should return: "/abc123.jpg" or similar
   ```

3. **API returns poster_url?**
   ```bash
   curl -H "X-User-Id: 1" http://localhost:8000/api/recommendations?limit=1 | jq '.recommendations[0].poster_url'
   # Should return: "https://image.tmdb.org/t/p/w500/..."
   ```

4. **Frontend uses correct field?**
   - Check browser console for errors
   - Inspect element - `<img src>` should be full TMDb URL

**Solutions:**
1. Re-fetch TMDb data: `python -m scripts.fetch_tmdb_metadata`
2. Rebuild catalog: `python -m ml.preprocess_catalog`
3. Retrain model: `python -m ml.train_model`
4. Restart backend: `uvicorn app.main:app --reload`
5. Hard refresh frontend: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Synopses Missing

**Issue:** "No description available" showing for all movies

**Checks:**
1. **TMDb data has overviews?**
   ```bash
   head -5 backend/raw/tmdb/tmdb_metadata.csv | cut -d',' -f7
   # Should show overview text
   ```

2. **Model includes overviews?**
   ```bash
   cat backend/ml/artifacts/movies_meta.json | jq '.[0].overview'
   # Should return: "Movie description..."
   ```

3. **API returns overview?**
   ```bash
   curl -H "X-User-Id: 1" http://localhost:8000/api/recommendations?limit=1 | jq '.recommendations[0].overview'
   # Should return: "Movie description..."
   ```

**Solutions:** Same as above

### TMDb API Rate Limiting

**Issue:** `fetch_tmdb_metadata.py` fails with 429 errors

**Solution:**
- Script already handles rate limiting with exponential backoff
- Wait for `Retry-After` header
- Reduce pacing in script if needed (increase `time.sleep(0.02)`)

---

## 📝 Summary

**What Changed:**
1. ✅ TMDb fetch now includes `poster_path` and `overview`
2. ✅ Preprocessing keeps these fields in merged catalog
3. ✅ Recommender builds full poster URLs
4. ✅ API returns `poster_url` and `overview` for each movie
5. ✅ Frontend displays real posters and synopses with fallbacks

**Benefits:**
- Users see real movie posters (much better UX)
- Users can read synopses to decide what to watch
- Graceful fallback for missing data
- Backward compatible with existing code

**Next Steps:**
1. Fetch TMDb metadata (if not done)
2. Rebuild catalog and model
3. Test in frontend
4. Optionally: Add backdrop images, cast photos, etc.

---

## 🎯 Example: Complete Workflow

```bash
# 1. Setup (one-time)
cd backend
echo "TMDB_BEARER_TOKEN=your_token" >> .env

# 2. Fetch TMDb data (~20 min for full catalog)
python -m scripts.fetch_tmdb_metadata

# 3. Rebuild data pipeline
python -m ml.preprocess_catalog
python -m ml.train_model

# 4. Start backend
uvicorn app.main:app --reload --port 8000

# 5. Start frontend (different terminal)
cd ..
npm run dev

# 6. Test
# Open http://localhost:5173
# Sign in and check recommendations
```

**Expected Result:**
- Real movie posters load
- Synopses display under titles
- No broken images
- Purple placeholders for missing posters

✅ **Done!** Your CineMatch app now shows real TMDb posters and synopses!

