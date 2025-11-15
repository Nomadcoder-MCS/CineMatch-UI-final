# Genre Diversity Testing Guide

## Testing the Genre Diversity Improvements

### Setup

1. **Start the backend**:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

2. **Start the frontend**:
```bash
npm run dev
```

### Test Scenarios

#### Test 1: Cold Start (No Likes, Only Preferences)

**User Setup**:
- Email: `test1@example.com`
- Preferred genres: Animation, Sci-Fi, Adventure

**Expected Behavior**:
- Profile built from genres (Strategy 3)
- Console log: "Using genre-based profile (no likes yet)"
- Results should be heavily weighted toward Animation, Sci-Fi, Adventure

**Verification**:
```bash
# Check backend logs for:
"Built profile from X preferred genres: ['animation', 'sci-fi', 'adventure']"
"→ Using genre-based profile (no likes yet)"
```

#### Test 2: Hybrid Profile (Has Likes + Preferences)

**User Setup**:
- Email: `test2@example.com`
- Preferred genres: Animation, Comedy, Romance
- Liked movies: 1 Action movie (e.g., The Dark Knight)

**Expected Behavior**:
- Hybrid profile: 80% Action + 20% Animation/Comedy/Romance
- Console log: "Using hybrid profile (80% likes + 20% preferred genres)"
- Results should include both Action AND some Animation/Comedy/Romance

**Verification**:
```bash
# Check backend logs for:
"Built base profile from 1 liked movies"
"Created genre boost from 3 preferred genres: ['animation', 'comedy', 'romance']"
"→ Using hybrid profile (80% likes + 20% preferred genres)"
"Applied genre boost for preferred genres: ['animation', 'comedy', 'romance']"
```

#### Test 3: Genre Diversification

**User Setup**:
- Email: `test3@example.com`
- Preferred genres: Action, Thriller, Drama, Comedy, Sci-Fi
- Multiple likes in Action/Thriller

**Expected Behavior**:
- Max 6 movies per genre in 20-movie list
- No single genre dominates (e.g., not 15/20 Action)
- Console log shows diversification step

**Verification**:
```bash
# Check backend logs for:
"✓ Filtered to X candidate recommendations"
"→ Diversified to Y recommendations (max 6 per genre)"
```

**Manual Check**:
- Count genres in results
- No genre should have > 6 movies
- Preferred genres should appear

#### Test 4: Exploration Component

**User Setup**:
- Email: `test4@example.com`
- Preferred genres: Animation, Fantasy, Sci-Fi
- Liked movies: 3-4 Action/Crime movies

**Expected Behavior**:
- Base recommendations favor Action/Crime (from likes)
- But exploration adds Animation/Fantasy/Sci-Fi movies
- Console log shows exploration

**Verification**:
```bash
# Check backend logs for:
"Adding exploration for underrepresented genres: ['animation', 'fantasy', 'sci-fi']"
"→ Added 2 exploration movies"
```

**Manual Check**:
- Look at positions 7, 14, 19 in results
- Should see Animation/Fantasy/Sci-Fi movies mixed in

### Debug Console Logs

The backend now prints detailed logs for each recommendation request:

```
============================================================
Generating recommendations for user: Test User (ID: 1)
  Mode: because_liked
============================================================
Built base profile from 3 liked movies
Created genre boost from 4 preferred genres: ['animation', 'adventure', 'sci-fi', 'comedy']
  → Using hybrid profile (80% likes + 20% preferred genres)
  Applied genre boost for preferred genres: ['animation', 'adventure', 'sci-fi', 'comedy']
✓ Filtered to 40 candidate recommendations
  → Diversified to 20 recommendations (max 6 per genre)
  Adding exploration for underrepresented genres: ['animation', 'sci-fi']
  → Added 2 exploration movies
✓ Final: 22 personalized recommendations
```

### Expected Genre Distribution

For a user with preferences `['animation', 'adventure', 'sci-fi', 'comedy']`:

**Before Fix**:
- Action: 10 movies (50%)
- Crime: 6 movies (30%)
- Thriller: 3 movies (15%)
- Drama: 1 movie (5%)
- **Total: 20 movies, 0 from preferred genres**

**After Fix**:
- Adventure: 6 movies (27%)
- Action: 5 movies (23%)
- Sci-Fi: 4 movies (18%)
- Animation: 3 movies (14%)
- Comedy: 4 movies (18%)
- **Total: 22 movies, 17 from preferred genres (77%)**

### API Testing with curl

Test the API directly:

```bash
# 1. Create/get user
curl -X POST http://localhost:8000/api/auth/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Response: {"id": 1, "email": "test@example.com", ...}

# 2. Set preferences
curl -X PUT http://localhost:8000/api/preferences/me \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "preferred_genres": ["animation", "sci-fi", "adventure"],
    "services": ["Netflix"],
    "runtime_min": 80,
    "runtime_max": 150
  }'

# 3. Get recommendations
curl http://localhost:8000/api/recommendations?limit=20 \
  -H "X-User-Id: 1"

# 4. Check genre distribution in response
# Count occurrences of each genre in results
```

### Metrics to Track

1. **Genre Coverage**: % of preferred genres that appear in results
2. **Genre Balance**: Max movies per genre / Total movies
3. **Preference Alignment**: % of movies matching at least one preferred genre
4. **Exploration Success**: # of underrepresented genres that get ≥2 movies

### Success Criteria

✅ **Hybrid profile**: Logs show "Using hybrid profile" when user has both likes and preferences  
✅ **Genre boost**: Preferred genres get +0.15 score bonus  
✅ **Diversification**: No genre exceeds 6 movies (30%) in results  
✅ **Exploration**: Underrepresented genres get 2+ movies injected  
✅ **Overall**: ≥70% of results match at least one preferred genre

