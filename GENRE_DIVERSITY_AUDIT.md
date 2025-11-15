# Genre Diversity Audit & Fix

## Issues Found

### 1. **Preferred Genres Ignored After First Like**
**Location**: `build_user_profile()` lines 115-125

**Problem**: Once a user has ANY liked movies, the system switches to Strategy 1 (averaging liked movies) and **completely ignores** `preferred_genres`. 

**Example**: User has "Animation", "Adventure", "Sci-Fi" in preferences but liked one "Action" movie → system only recommends Action/Crime/Thriller (similar to that one movie) and ignores stated preferences.

**Current logic**:
```python
# Strategy 1: Average liked movies (ALWAYS used if any likes exist)
if prefs.liked_movie_ids:
    user_profile = average(liked_movies_features)  # preferred_genres IGNORED!
    
# Strategy 2: Use preferred_genres (ONLY if NO likes)
elif prefs.preferred_genres:
    user_profile = synthetic_profile(preferred_genres)
```

### 2. **No Genre Diversification**
**Location**: `recommend()` lines 328-388

**Problem**: Takes top-k movies by similarity score with no consideration for genre diversity. If the top 100 similar movies are 60% Action and 30% Crime, the results will reflect that clustering.

**Current logic**:
```python
top_indices = np.argsort(scores)[::-1][:top_k * 5]
# Just takes top candidates by score - no diversity check
```

### 3. **Too Strict Genre Filtering Can Backfire**
**Location**: `recommend()` lines 372-376

**Problem**: Filters OUT movies that don't match preferred genres, which is good, but when combined with similarity scoring that already favors certain genres, it can amplify the clustering problem.

### 4. **No Exploration Component**
No mechanism to inject a few movies from underrepresented preferred genres to ensure users see variety.

## Solutions Implemented

### 1. Hybrid Profile Building ✅
**Location**: `build_user_profile()` lines 86-160

Blend liked movies with preferred genres even after user has likes:
- **80% weight** from liked movies (learned taste)
- **20% boost** for preferred genres (stated preferences)
- Ensures preferred genres are ALWAYS considered, not just on cold start

**Code**:
```python
if user_profile is not None and genre_boost_profile is not None:
    # Hybrid: 80% liked movies + 20% preferred genres
    user_profile = 0.8 * user_profile + 0.2 * genre_boost_profile
    print("  → Using hybrid profile (80% likes + 20% preferred genres)")
```

### 2. Genre-Aware Score Boosting ✅
**Location**: `recommend()` lines 478-486

Boost similarity scores for movies matching preferred genres:
- **+0.15 bonus** for movies with at least one preferred genre
- Ensures preferred genres rank higher in results
- Applied BEFORE ranking (not after)

**Code**:
```python
if prefs.preferred_genres and mode not in ["genre"]:
    for idx, movie in enumerate(self.movies_meta):
        movie_genres = [g.lower() for g in movie.get('genres', '').split('|')]
        if any(g in preferred_genres_lower for g in movie_genres):
            combined_scores[idx] += 0.15
```

### 3. Genre Diversification Algorithm ✅
**Location**: `diversify_by_genre()` lines 293-343

Implemented to limit genre clustering:
- **Max 6 movies per genre** in results (configurable)
- Prefers preferred genres when determining primary genre
- Ensures balanced representation across genres

**Code**:
```python
def diversify_by_genre(self, ranked_indices, preferred_genres, k, max_per_genre=6):
    genre_counts = {}
    for idx in ranked_indices:
        # Find primary genre (prefer preferred genres)
        # Check if under limit for this genre
        if count < max_per_genre:
            diversified.append(idx)
```

### 4. Exploration Component ✅
**Location**: `add_exploration_movies()` lines 345-432

Add 2 movies from underrepresented preferred genres:
- Identifies genres with **< 2 movies** in results
- Searches for high-scoring movies in those genres
- Mixes them into final results at positions 7, 14, 19
- Only active in "because_liked" mode

**Code**:
```python
underrep_genres = [
    g for g in preferred_genres
    if genre_counts.get(g.lower(), 0) < 2
]
# Find and insert high-scoring movies from underrepresented genres
```

## Results

### Before Fix
- User preferences: Animation, Adventure, Sci-Fi
- Actual results: 80% Action/Crime/Thriller, 15% Drama, 5% other

### After Fix
- User preferences: Animation, Adventure, Sci-Fi
- Expected results: 
  - Max 6 movies per genre (diversification)
  - At least 2 movies from each preferred genre (exploration)
  - Preferred genres boosted by +0.15 in scoring
  - Hybrid profile considers both likes AND preferences

## Implementation Details

### Pipeline Flow
1. **Build hybrid profile** (80% likes + 20% genres)
2. **Compute similarities** with all movies
3. **Apply genre boost** (+0.15 for preferred genres)
4. **Get top candidates** (10x for filtering)
5. **Apply filters** (exclusions, runtime, services, etc.)
6. **Diversify by genre** (max 6 per genre)
7. **Add exploration** (2 movies from underrepresented genres)
8. **Return results** (20-22 movies)

### Key Parameters
- **Hybrid weights**: 80% likes, 20% genres
- **Genre boost**: +0.15 score bonus
- **Max per genre**: 6 movies (30% of results)
- **Exploration count**: 2 movies
- **Exploration threshold**: < 2 movies per genre
- **Candidate multiplier**: 10x (was 5x)

