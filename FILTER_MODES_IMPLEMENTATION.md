# Filter Modes Implementation

## Summary

Wired up the filter buttons on the Home screen so they control how recommendations are fetched and displayed. Users can now switch between different recommendation modes and apply specific filters.

## Implementation

### Frontend Changes (`src/pages/HomePage.jsx`)

#### 1. State Management
Added comprehensive state for modes and filters:
- **Mode**: `'because_liked' | 'trending' | 'genre' | 'service' | 'year' | 'runtime'`
- **Filters**:
  - `selectedGenre`: Genre to filter by
  - `selectedService`: Streaming service to filter by
  - `selectedYearBucket`: Year range (`'recent' | '2010s' | '2000s' | '90s' | 'classic'`)
  - `selectedRuntimeBucket`: Runtime range (`'short' | 'medium' | 'long'`)
- **Preferences**: Loaded from `/api/preferences/me` to populate filter options

#### 2. Button Wiring
- Each mode button now calls `handleModeChange()` which:
  - Sets the active mode
  - Initializes filters with user preferences when appropriate
  - Triggers a new recommendation fetch via `useEffect`

#### 3. Dynamic Filter Controls
Shows contextual filter chips based on the active mode:
- **Genre mode**: Shows chips for user's preferred genres
- **Service mode**: Shows chips for user's streaming services
- **Year mode**: Shows chips for year buckets (2018+, 2010s, 2000s, 90s, Pre-1990)
- **Runtime mode**: Shows chips for runtime buckets (<90 min, 90-150 min, >150 min)

#### 4. API Integration
`loadRecommendations()` now builds query params based on mode and filters:
```javascript
const params = new URLSearchParams();
params.set('limit', '20');
params.set('mode', mode);

if (mode === 'genre' && selectedGenre) {
  params.set('genre', selectedGenre);
}
// ... other filters
```

#### 5. Reactive Updates
Added `useEffect` dependency on all filter state:
```javascript
useEffect(() => {
  loadRecommendations();
}, [authReady, user?.id, mode, selectedGenre, selectedService, 
    selectedYearBucket, selectedRuntimeBucket]);
```

### Backend Changes

#### 1. Routes (`backend/app/api/routes_recs.py`)

**New Enum:**
```python
class RecMode(str, Enum):
    because_liked = "because_liked"
    trending = "trending"
    genre = "genre"
    service = "service"
    year = "year"
    runtime = "runtime"
```

**Extended Endpoint:**
```python
@router.get("/api/recommendations")
async def get_recommendations_for_user(
    limit: int = Query(default=20, ge=1, le=100),
    mode: RecMode = Query(default=RecMode.because_liked),
    genre: Optional[str] = Query(default=None),
    service: Optional[str] = Query(default=None),
    year_bucket: Optional[str] = Query(default=None),
    runtime_bucket: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
```

Passes mode and filter parameters to the recommender.

#### 2. Recommender (`backend/ml/recommender.py`)

**New Helper Methods:**
- `filter_by_year_bucket()`: Filters movies by year range
  - `recent`: 2018+
  - `2010s`: 2010-2019
  - `2000s`: 2000-2009
  - `90s`: 1990-1999
  - `classic`: Pre-1990

- `filter_by_runtime_bucket()`: Filters movies by runtime
  - `short`: <90 minutes
  - `medium`: 90-150 minutes
  - `long`: >150 minutes

- `compute_popularity_scores()`: Computes popularity based on recency
  - Simple heuristic: normalizes movie years to [0, 1]
  - More recent movies score higher
  - In production, would use actual view counts, ratings, etc.

**Updated `recommend()` Method:**
```python
def recommend(
    self, 
    prefs: UserPreferences, 
    top_k: int = 20,
    mode: str = "because_liked",
    filter_genre: str = None,
    filter_service: str = None,
    filter_year_bucket: str = None,
    filter_runtime_bucket: str = None
) -> list[dict]:
```

**Mode-Specific Logic:**

1. **because_liked** (default):
   - Pure content-based similarity
   - Uses user profile built from liked movies

2. **trending**:
   - Blends similarity with popularity
   - Formula: `0.7 * similarity + 0.3 * popularity`
   - Recommends popular recent movies aligned with user taste

3. **genre**:
   - Filters candidates to match selected genre
   - Case-insensitive matching
   - Still respects user preferences for other attributes

4. **service**:
   - Filters candidates to match selected streaming service
   - Ensures all recommendations are available on chosen platform

5. **year**:
   - Filters candidates to match selected year bucket
   - Allows users to explore movies from specific eras

6. **runtime**:
   - Filters candidates to match selected runtime bucket
   - Helps users find movies that fit their available time

**Filtering Strategy:**
- Always excludes: `not_interested_ids`, `liked_movie_ids`, `disliked_movie_ids`
- Applies mode-specific filter (genre, service, year, or runtime)
- Applies user preference filters (runtime range, preferred genres/services)
- Avoids double-filtering: doesn't apply genre filter in genre mode, etc.
- Gets 5x candidates before filtering to ensure enough results

## User Experience

### Default Flow
1. User lands on Home page → "Because you liked" mode is active
2. Recommendations based on pure similarity to liked movies

### Switching Modes
1. User clicks "Trending for you" → Gets popular recent movies aligned with taste
2. User clicks "Genre" → Selects from preferred genres → Gets genre-specific recs
3. User clicks "Service" → Selects from streaming services → Gets platform-specific recs
4. User clicks "Year" → Selects time period → Gets era-specific recs
5. User clicks "Runtime" → Selects duration → Gets length-specific recs

### Visual Feedback
- Active mode is highlighted with orange background
- Selected filter chips are highlighted with purple background
- Filter controls appear/disappear based on mode
- Recommendations update automatically when mode or filter changes

## Technical Notes

### Performance
- Gets 5x candidates before filtering (instead of 3x) to ensure enough results
- Early stopping once `top_k` results are found
- Efficient numpy operations for similarity and popularity scoring

### Robustness
- Handles missing metadata gracefully (year, runtime, etc.)
- Case-insensitive genre matching
- Falls back to empty results if no matches found
- Maintains user preference filtering across all modes

### Future Enhancements
- Add actual popularity metrics (view counts, ratings)
- Support multiple genre/service selection
- Add more sophisticated trending algorithm
- Cache popular queries for faster response
- Add analytics to track mode usage

