# Python Backend Integration Checklist

Use this checklist to integrate CineMatch UI with your Python recommendation engine.

## ✅ Phase 1: Backend Setup

### Python Dependencies
```bash
pip install flask flask-cors pandas scikit-learn
```

### Basic Flask Server Structure
```python
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Your recommendation engine class
class RecommendationEngine:
    def __init__(self):
        # Load movie data, train models, etc.
        pass
    
    def get_recommendations(self, user_id, **filters):
        # Return personalized recommendations
        pass

engine = RecommendationEngine()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## ✅ Phase 2: Core API Endpoints

### 1. Get Recommendations
- [ ] Endpoint: `GET /api/recommendations/:userId`
- [ ] Returns: Array of Movie objects
- [ ] Filters: genre, service, year, runtime (query params)
- [ ] Location: `src/services/recommendations.js` → `fetchRecommendations()`

```python
@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    genres = request.args.getlist('genre')
    services = request.args.getlist('service')
    recommendations = engine.get_recommendations(
        user_id=user_id,
        genres=genres,
        services=services,
        limit=10
    )
    return jsonify(recommendations)
```

### 2. Get Watchlist
- [ ] Endpoint: `GET /api/watchlist/:userId`
- [ ] Returns: Array of WatchlistItem objects
- [ ] Location: `src/services/recommendations.js` → `fetchWatchlist()`

```python
@app.route('/api/watchlist/<user_id>', methods=['GET'])
def get_watchlist(user_id):
    items = database.get_watchlist(user_id)
    return jsonify(items)
```

### 3. Add to Watchlist
- [ ] Endpoint: `POST /api/watchlist/:userId`
- [ ] Body: `{ movieId: string }`
- [ ] Location: `src/services/recommendations.js` → `addToWatchlist()`

```python
@app.route('/api/watchlist/<user_id>', methods=['POST'])
def add_to_watchlist(user_id):
    movie_id = request.json.get('movieId')
    database.add_to_watchlist(user_id, movie_id)
    return jsonify({'success': True})
```

### 4. Record Feedback
- [ ] Endpoint: `POST /api/feedback/:userId`
- [ ] Body: `{ movieId: string, liked: boolean }`
- [ ] Location: `src/services/recommendations.js` → `recordFeedback()`

```python
@app.route('/api/feedback/<user_id>', methods=['POST'])
def record_feedback(user_id):
    movie_id = request.json.get('movieId')
    liked = request.json.get('liked')
    engine.update_user_profile(user_id, movie_id, liked)
    return jsonify({'success': True})
```

### 5. Rebuild Recommendations
- [ ] Endpoint: `POST /api/recommendations/:userId/rebuild`
- [ ] Location: `src/services/recommendations.js` → `rebuildRecommendations()`

```python
@app.route('/api/recommendations/<user_id>/rebuild', methods=['POST'])
def rebuild_recommendations(user_id):
    engine.rebuild_user_profile(user_id)
    return jsonify({'success': True})
```

## ✅ Phase 3: Secondary Endpoints

### Mark as Watched
- [ ] Endpoint: `PUT /api/watchlist/:userId/:movieId/watched`
- [ ] Body: `{ watched: boolean }`
- [ ] Location: `src/services/recommendations.js` → `markWatched()`

### Remove from Watchlist
- [ ] Endpoint: `DELETE /api/watchlist/:userId/:movieId`
- [ ] Location: `src/services/recommendations.js` → `removeFromWatchlist()`

### Mark Not Interested
- [ ] Endpoint: `POST /api/not-interested/:userId`
- [ ] Body: `{ movieId: string }`
- [ ] Location: `src/services/recommendations.js` → `markNotInterested()`

### Update Preferences
- [ ] Endpoint: `PUT /api/preferences/:userId`
- [ ] Body: `{ genres: [], languages: [], services: [] }`
- [ ] Location: `src/services/recommendations.js` → `updatePreferences()`

### Export Data
- [ ] Endpoint: `GET /api/export/:userId`
- [ ] Returns: CSV file
- [ ] Location: `src/services/recommendations.js` → `exportUserData()`

### Clear History
- [ ] Endpoint: `DELETE /api/history/:userId`
- [ ] Location: `src/services/recommendations.js` → `clearRecommendationHistory()`

## ✅ Phase 4: Update Frontend Service Layer

Open `src/services/recommendations.js` and replace each function:

### Example Replacement Pattern

**Before (Mock):**
```javascript
export async function fetchRecommendations(userId) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMovies;
}
```

**After (Production):**
```javascript
export async function fetchRecommendations(userId) {
  const response = await fetch(`/api/recommendations/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
}
```

### All Functions to Update
- [ ] `fetchRecommendations(userId)`
- [ ] `fetchWatchlist(userId)`
- [ ] `addToWatchlist(userId, movieId)`
- [ ] `removeFromWatchlist(userId, movieId)`
- [ ] `markWatched(userId, movieId, watched)`
- [ ] `rebuildRecommendations(userId)`
- [ ] `recordFeedback(userId, movieId, liked)`
- [ ] `markNotInterested(userId, movieId)`
- [ ] `updatePreferences(userId, preferences)`
- [ ] `exportUserData(userId)`
- [ ] `clearRecommendationHistory(userId)`

## ✅ Phase 5: Configure Vite Proxy

Update `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

## ✅ Phase 6: Data Models

Ensure your Python backend returns data in these exact formats:

### Movie Object
```json
{
  "id": "1",
  "title": "Neon City",
  "year": 2023,
  "runtime": "2h 10m",
  "synopsis": "A cyberpunk thriller...",
  "genres": ["Sci-Fi", "Action"],
  "services": ["Netflix"],
  "posterUrl": "https://...",
  "score": 8.7
}
```

### WatchlistItem Object
```json
{
  "id": "101",
  "title": "Arrival",
  "year": 2016,
  "runtime": "2h 7m",
  "synopsis": "A linguist is recruited...",
  "genres": ["Sci-Fi", "Drama"],
  "services": ["Hulu"],
  "posterUrl": "https://...",
  "addedDate": "2024-11-10",
  "watched": false
}
```

## ✅ Phase 7: Testing

### Start Both Servers
```bash
# Terminal 1 - Python backend
python app.py

# Terminal 2 - React frontend
npm run dev
```

### Test Each Integration Point

1. **Home Page**
   - [ ] Recommendations load on page load
   - [ ] Thumbs up/down sends feedback
   - [ ] "Not interested" works
   - [ ] "+ Watchlist" adds to watchlist

2. **Watchlist Page**
   - [ ] Watchlist items display
   - [ ] "Mark watched" checkbox works
   - [ ] Remove button works
   - [ ] Filters work (All, To Watch, Watched)

3. **Profile Page**
   - [ ] "Rebuild recommendations" triggers rebuild
   - [ ] "Export data" downloads CSV
   - [ ] "Clear history" clears data
   - [ ] Service toggles update preferences
   - [ ] Notification toggles save

### Check Browser Console
- [ ] No CORS errors
- [ ] API calls show in Network tab
- [ ] Responses match expected format

## ✅ Phase 8: Recommendation Engine Logic

### Content-Based Filtering Implementation

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class RecommendationEngine:
    def __init__(self, movies_df):
        self.movies_df = movies_df
        self.tfidf = TfidfVectorizer(stop_words='english')
        
        # Combine features for content-based filtering
        self.movies_df['combined_features'] = (
            self.movies_df['genres'].str.join(' ') + ' ' +
            self.movies_df['director'] + ' ' +
            self.movies_df['cast'].str.join(' ') + ' ' +
            self.movies_df['plot_keywords'].str.join(' ')
        )
        
        # Create TF-IDF matrix
        self.tfidf_matrix = self.tfidf.fit_transform(
            self.movies_df['combined_features']
        )
    
    def get_recommendations(self, user_id, genres=None, services=None, limit=10):
        # Get user profile
        user_profile = self.build_user_profile(user_id)
        
        # Calculate similarity scores
        user_vector = self.tfidf.transform([user_profile])
        similarity_scores = cosine_similarity(user_vector, self.tfidf_matrix)[0]
        
        # Get movie indices sorted by similarity
        movie_indices = similarity_scores.argsort()[::-1]
        
        # Apply filters
        recommendations = []
        for idx in movie_indices:
            movie = self.movies_df.iloc[idx]
            
            # Filter by genre
            if genres and not any(g in movie['genres'] for g in genres):
                continue
            
            # Filter by service
            if services and not any(s in movie['services'] for s in services):
                continue
            
            recommendations.append(movie.to_dict())
            
            if len(recommendations) >= limit:
                break
        
        return recommendations
    
    def build_user_profile(self, user_id):
        # Get user's liked movies, watchlist, preferences
        liked_movies = self.get_user_liked_movies(user_id)
        preferences = self.get_user_preferences(user_id)
        
        # Combine into a text profile
        profile_text = ' '.join(preferences['genres']) + ' '
        profile_text += ' '.join(liked_movies['genres'].str.join(' '))
        
        return profile_text
```

## ✅ Phase 9: Error Handling

Add error handling in frontend service layer:

```javascript
export async function fetchRecommendations(userId) {
  try {
    const response = await fetch(`/api/recommendations/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Return empty array or show user-friendly error
    return [];
  }
}
```

Add error handling in Python backend:

```python
@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    try:
        recommendations = engine.get_recommendations(user_id)
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## ✅ Phase 10: Production Deployment

### Frontend (Vercel/Netlify)
- [ ] Build: `npm run build`
- [ ] Set environment variable: `VITE_API_URL=https://your-backend.com`
- [ ] Deploy `dist/` folder

### Backend (Heroku/Railway/Fly.io)
- [ ] Create `requirements.txt`
- [ ] Create `Procfile`: `web: gunicorn app:app`
- [ ] Set CORS to allow frontend domain
- [ ] Deploy Python app

### Update API Calls
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchRecommendations(userId) {
  const response = await fetch(`${API_URL}/recommendations/${userId}`);
  return response.json();
}
```

## 🎯 Quick Win: Test with Mock Backend

Before building the full recommendation engine, test with a minimal Flask app:

```python
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MOCK_MOVIES = [
    {
        "id": "1",
        "title": "Test Movie",
        "year": 2023,
        "runtime": "2h",
        "synopsis": "A test movie",
        "genres": ["Action"],
        "services": ["Netflix"],
        "posterUrl": "https://via.placeholder.com/300x450",
        "score": 8.5
    }
]

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    return jsonify(MOCK_MOVIES)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

Then update just the `fetchRecommendations()` function in the frontend to test the connection!

---

## Summary

1. ✅ Set up Flask backend with CORS
2. ✅ Implement 11 API endpoints
3. ✅ Update frontend service layer
4. ✅ Configure Vite proxy
5. ✅ Build recommendation engine logic
6. ✅ Test all integration points
7. ✅ Add error handling
8. ✅ Deploy to production

**Estimated Time:** 
- Basic integration (mock data): 2-4 hours
- Full recommendation engine: 1-2 weeks
- Production deployment: 4-8 hours

Good luck! 🚀

