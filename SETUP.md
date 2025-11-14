# CineMatch Setup & Integration Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### 3. Navigate the App

- **Landing Page**: `http://localhost:5173/` - Marketing page for signed-out users
- **Home Page**: `http://localhost:5173/home` - Recommendations dashboard
- **Watchlist**: `http://localhost:5173/watchlist` - Saved movies
- **Profile**: `http://localhost:5173/profile` - User settings

## File Structure

```
CineMatch-UI2/
├── index.html                      # HTML entry point
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind design tokens
├── postcss.config.js               # PostCSS configuration
├── .gitignore                      # Git ignore rules
├── .eslintrc.cjs                   # ESLint configuration
├── README.md                       # Project documentation
├── SETUP.md                        # This file
└── src/
    ├── main.jsx                    # React entry point
    ├── App.jsx                     # Main app with routing
    ├── index.css                   # Tailwind imports + global styles
    ├── pages/
    │   ├── LandingPage.jsx         # Marketing page (/)
    │   ├── HomePage.jsx            # Recommendations (/home)
    │   ├── WatchlistPage.jsx       # Watchlist (/watchlist)
    │   └── ProfilePage.jsx         # Profile (/profile)
    ├── components/
    │   ├── TopNavSignedOut.jsx     # Landing page nav
    │   ├── TopNavSignedIn.jsx      # Signed-in nav
    │   ├── MovieCard.jsx           # Recommendation card
    │   ├── WatchlistItem.jsx       # Watchlist row item
    │   ├── TagChip.jsx             # Genre/service badge
    │   └── FilterChip.jsx          # Filter pill button
    └── services/
        └── recommendations.js       # API integration layer
```

## Design System Reference

### Colors (Tailwind Config)

```javascript
'brand-orange': '#F56600',      // Primary CTA
'brand-purple': '#522D80',      // Secondary accent
'brand-bg': '#EDEDED',          // Page background
'brand-surface': '#FFFFFF',     // Cards/surfaces
'brand-text-primary': '#111111', // Headings
'brand-text-body': '#444444',    // Body text
'brand-text-secondary': '#777777', // Meta/captions
'brand-border': '#DDDDDD',      // Dividers
```

### Usage Examples

```jsx
// Background colors
<div className="bg-brand-bg">      // Light grey background
<div className="bg-brand-surface">  // White surface
<div className="bg-brand-orange">   // Orange button

// Text colors
<h1 className="text-brand-text-primary">  // Dark heading
<p className="text-brand-text-body">      // Body text
<span className="text-brand-text-secondary"> // Meta text

// Borders
<div className="border-brand-border">
```

## Component API

### MovieCard

```jsx
<MovieCard 
  movie={{
    id: '1',
    title: 'Neon City',
    year: 2023,
    runtime: '2h 10m',
    synopsis: 'A cyberpunk thriller...',
    genres: ['Sci-Fi', 'Action'],
    services: ['Netflix'],
    posterUrl: 'https://...',
    score: 8.7
  }}
  userId="user123"
/>
```

**Actions:**
- Thumbs up/down feedback
- Not interested
- Add to watchlist (navigates to /watchlist)
- Why this? (shows alert with reasoning)

### WatchlistItem

```jsx
<WatchlistItem 
  item={{
    id: '101',
    title: 'Arrival',
    year: 2016,
    runtime: '2h 7m',
    synopsis: 'A linguist is recruited...',
    genres: ['Sci-Fi', 'Drama'],
    services: ['Hulu'],
    posterUrl: 'https://...',
    addedDate: '2024-11-10',
    watched: false
  }}
  userId="user123"
  onUpdate={() => loadWatchlist()}
/>
```

**Actions:**
- Mark as watched checkbox
- Remove from watchlist (three dots menu)

### FilterChip

```jsx
<FilterChip 
  label="Genre"
  active={isActive}
  onClick={() => handleFilter()}
/>
```

### TagChip

```jsx
<TagChip label="Sci-Fi" variant="genre" />
<TagChip label="Netflix" variant="service" />
<TagChip label="English" variant="default" />
```

## Python Backend Integration

### Step 1: Set Up API Endpoints

Your Python backend should expose these REST endpoints:

#### Recommendations
```
GET /api/recommendations/:userId
  Response: Movie[]
  
POST /api/recommendations/:userId/rebuild
  Response: { success: boolean }
```

#### Watchlist
```
GET /api/watchlist/:userId
  Response: WatchlistItem[]
  
POST /api/watchlist/:userId
  Body: { movieId: string }
  Response: { success: boolean }
  
DELETE /api/watchlist/:userId/:movieId
  Response: { success: boolean }
  
PUT /api/watchlist/:userId/:movieId/watched
  Body: { watched: boolean }
  Response: { success: boolean }
```

#### Feedback
```
POST /api/feedback/:userId
  Body: { movieId: string, liked: boolean }
  Response: { success: boolean }
  
POST /api/not-interested/:userId
  Body: { movieId: string }
  Response: { success: boolean }
```

#### Preferences
```
PUT /api/preferences/:userId
  Body: { 
    genres: string[],
    languages: string[],
    services: string[]
  }
  Response: { success: boolean }
```

#### Data & Privacy
```
GET /api/export/:userId
  Response: CSV file blob
  
DELETE /api/history/:userId
  Response: { success: boolean }
```

### Step 2: Update Service Layer

In `src/services/recommendations.js`, replace mock implementations:

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
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}
```

### Step 3: Configure API Proxy (Development)

Update `vite.config.js` to proxy API requests to your Python backend:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your Python backend
        changeOrigin: true,
      }
    }
  }
})
```

### Step 4: Test Integration

1. Start Python backend on `http://localhost:5000`
2. Start Vite dev server: `npm run dev`
3. Open browser to `http://localhost:5173/home`
4. Check Network tab to see API calls

## Recommendation Engine Requirements

### Content-Based Filtering

The Python backend should implement:

1. **Feature Extraction**
   - Extract features from movies (genres, cast, director, plot keywords, year, runtime)
   - Convert to feature vectors using TF-IDF or similar

2. **User Profile Building**
   - Build user preference profile from:
     - Explicit preferences (genres, languages, services)
     - Implicit feedback (watchlist, likes, watches)
   - Weight recent interactions higher

3. **Similarity Scoring**
   - Calculate cosine similarity between user profile and movie features
   - Apply constraints (service availability, language)
   - Rank by similarity score

4. **Explainability**
   - Track which features contributed to each recommendation
   - Return reasoning: "Because you liked [Genre], this has [matching features]"

### Data Models (Python)

```python
from dataclasses import dataclass
from typing import List

@dataclass
class Movie:
    id: str
    title: str
    year: int
    runtime: str
    synopsis: str
    genres: List[str]
    services: List[str]
    poster_url: str
    score: float
    
@dataclass
class UserPreferences:
    user_id: str
    genres: List[str]
    languages: List[str]
    services: List[str]
    
@dataclass
class Feedback:
    user_id: str
    movie_id: str
    liked: bool
    timestamp: str
```

### Sample Python Endpoint (Flask)

```python
from flask import Flask, jsonify, request
from recommendation_engine import RecommendationEngine

app = Flask(__name__)
engine = RecommendationEngine()

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    # Get filters from query params
    genres = request.args.getlist('genre')
    services = request.args.getlist('service')
    
    # Generate recommendations
    recommendations = engine.get_recommendations(
        user_id=user_id,
        genres=genres,
        services=services,
        limit=10
    )
    
    return jsonify([r.to_dict() for r in recommendations])

@app.route('/api/feedback/<user_id>', methods=['POST'])
def record_feedback(user_id):
    data = request.json
    engine.record_feedback(
        user_id=user_id,
        movie_id=data['movieId'],
        liked=data['liked']
    )
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Common Customizations

### Change Brand Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  'brand-orange': '#YOUR_COLOR',
  'brand-purple': '#YOUR_COLOR',
  // ...
}
```

### Add Authentication

1. Install auth library: `npm install @auth0/auth0-react`
2. Wrap app in `Auth0Provider`
3. Replace hardcoded `userId = 'user123'` with `const { user } = useAuth0()`
4. Add protected routes

### Add State Management

For larger apps, consider Redux or Zustand:

```bash
npm install zustand
```

```javascript
// store.js
import create from 'zustand'

export const useStore = create((set) => ({
  movies: [],
  setMovies: (movies) => set({ movies }),
}))
```

### Customize Movie Card Layout

Edit `src/components/MovieCard.jsx` to change:
- Poster size and aspect ratio
- Action button placement
- Tag display logic
- Synopsis length

### Add More Filters

In `HomePage.jsx`, expand filters:

```jsx
const [filters, setFilters] = useState({
  genre: [],
  service: [],
  year: { min: 1970, max: 2024 },
  runtime: { min: 0, max: 300 },
  rating: { min: 0, max: 10 }
});
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Environment Variables

Create `.env` file:

```
VITE_API_URL=https://your-backend.com
```

Access in code:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

## Troubleshooting

### Issue: Styles not loading

**Solution:** Ensure `src/index.css` is imported in `src/main.jsx`:
```javascript
import './index.css'
```

### Issue: Routes not working in production

**Solution:** Configure server to redirect all routes to `index.html`:

**Netlify** - Create `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel** - Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Issue: CORS errors with backend

**Solution:** Add CORS headers in Python backend:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Explore the four pages
4. 🔲 Build Python recommendation engine
5. 🔲 Implement REST API endpoints
6. 🔲 Update service layer to use real APIs
7. 🔲 Add authentication
8. 🔲 Deploy to production

## Support

For questions or issues:
- Check README.md for project overview
- Review component files for inline documentation
- Check console logs for integration hints (marked with TODO comments)

---

**Built with React 18, Tailwind CSS 3, and Vite 5** 🚀

