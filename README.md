# CineMatch - Quick Movie Picks for Busy Students

A production-quality React + Tailwind CSS movie recommendation app with clean design, reusable components, and a **Python ML backend powered by MovieLens 32M** (87K movies).

## 🎬 Features

- **Landing Page**: Marketing page with hero section, "How it works", and "For students" sections
- **Home Page**: Personalized movie recommendations dashboard with filters and context chips
- **Watchlist Page**: Save and manage movies to watch later
- **Profile Page**: Account settings, preferences, connected services, and data controls
- **ML Backend**: Content-based recommender using MovieLens 32M + optional TMDb enrichment

## 🚀 Quick Start

### Frontend
```bash
npm install
npm run dev
```
Visit http://localhost:5173

### Backend (Quick Setup)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python setup_pipeline.py   # Interactive setup wizard
```

**Full documentation:** [`backend/UPGRADE_COMPLETE.md`](backend/UPGRADE_COMPLETE.md)

## Design System

### Colors
- **Primary Orange**: `#F56600` - Main CTA and brand accent
- **Deep Purple**: `#522D80` - Secondary accent
- **Background**: `#EDEDED` - Light grey page background
- **Surface**: `#FFFFFF` - White cards and surfaces
- **Text Primary**: `#111111` - Headings
- **Text Body**: `#444444` - Body text
- **Text Secondary**: `#777777` - Meta/captions
- **Borders**: `#DDDDDD` - Dividers

### Typography
- Clean sans-serif (system default)
- Rounded corners on cards/buttons: 12-16px
- Soft shadows on cards
- 8px-based spacing grid

## Project Structure

This project contains both a **React frontend** and a **Python ML backend**:

### Frontend (React + Tailwind)

```
src/
├── pages/
│   ├── LandingPage.jsx      # Marketing page (/)
│   ├── HomePage.jsx          # Recommendations dashboard (/home)
│   ├── WatchlistPage.jsx     # Saved movies (/watchlist)
│   └── ProfilePage.jsx       # User settings (/profile)
├── components/
│   ├── TopNavSignedOut.jsx   # Nav bar for landing page
│   ├── TopNavSignedIn.jsx    # Nav bar for signed-in pages
│   ├── MovieCard.jsx         # Movie recommendation card
│   ├── WatchlistItem.jsx     # Watchlist entry row
│   ├── TagChip.jsx           # Genre/service badges
│   └── FilterChip.jsx        # Interactive filter pills
├── api/
│   └── cinematchApi.js       # Backend API client
├── App.jsx                   # Main app with routing
├── main.jsx                  # Entry point
└── index.css                 # Tailwind imports + minimal global styles
```

### Backend (Python + FastAPI + scikit-learn)

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   ├── routes_recs.py   # Recommendation endpoints
│   │   └── routes_watchlist.py  # Watchlist endpoints
│   └── schemas/             # Pydantic models
├── ml/
│   ├── train_model.py       # Training pipeline
│   ├── recommender.py       # Content-based recommender
│   ├── preprocess_catalog.py  # Data preprocessing
│   └── artifacts/           # Saved model artifacts
├── raw/
│   ├── ml-32m/              # MovieLens 32M dataset (87K movies)
│   └── tmdb/                # TMDb metadata (optional)
├── data/
│   └── movies_merged.csv    # Processed catalog (60-87K movies)
├── scripts/
│   └── fetch_tmdb_metadata.py  # TMDb API integration
├── tests/                   # Pytest tests
├── setup_pipeline.py        # Interactive setup wizard
├── DATA_PIPELINE.md         # Complete pipeline documentation
├── MIGRATION_GUIDE.md       # Migration from toy dataset
└── requirements.txt
```

## Getting Started

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)

### Backend Setup (Python ML Engine)

#### Quick Setup (Recommended)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python setup_pipeline.py   # Interactive wizard
```

The setup wizard will guide you through:
1. ✅ Checking data files
2. ✅ Preprocessing MovieLens 32M (87K movies)
3. ✅ Training ML model
4. ✅ Verifying everything works

**Result:** Backend with 60K+ movies ready to use!

#### Manual Setup

**Step 1:** Install dependencies
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Step 2:** Preprocess data
```bash
python -m ml.preprocess_catalog
```

**Step 3:** Train ML model
```bash
python -m ml.train_model
```

**Step 4:** Start backend server
```bash
uvicorn app.main:app --reload --port 8000
```

Backend will run on `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

**Step 5:** Run tests
```bash
pytest tests/ -v
```

#### Optional: Add TMDb Metadata

For higher quality recommendations with cast, directors, plot summaries:

1. Get API token from https://www.themoviedb.org/settings/api
2. Create `.env` file: `TMDB_BEARER_TOKEN=your_token`
3. Run: `python -m scripts.fetch_tmdb_metadata`
4. Reprocess: `python -m ml.preprocess_catalog`
5. Retrain: `python -m ml.train_model`

**See [`backend/DATA_PIPELINE.md`](backend/DATA_PIPELINE.md) for complete documentation.**

### Frontend Setup (React UI)

#### 1. Install Dependencies

```bash
# From project root
npm install
```

#### 2. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

The frontend will automatically connect to the backend at `http://localhost:8000`.

#### 3. Build for Production

```bash
npm run build
```

#### 4. Run Frontend Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

See **[TESTING.md](TESTING.md)** for comprehensive testing guide.

## ML Recommendation Engine

### How It Works

**Content-Based Filtering** using scikit-learn:

1. **Feature Engineering**
   - **TF-IDF**: Extract 500 features from movie overviews using unigrams + bigrams
   - **Genres**: Multi-hot encode genres (25 unique genres)
   - **Numeric**: Scale year and runtime
   - **Combined**: Horizontal stack into sparse feature matrix (30 movies × 527 features)

2. **User Profile**
   - Average feature vectors of liked movies
   - Or build from explicit genre/service preferences
   - Cold start: use dataset average

3. **Ranking**
   - Compute cosine similarity between user profile and all movie features
   - Apply filters (genres, services, runtime, exclude liked/disliked)
   - Return top-k ranked by similarity

4. **Explainability**
   - Generate human-readable reasons for each recommendation
   - Based on genre matches, service availability, similarity

### Example API Call

```javascript
// Frontend calls backend
const recommendations = await fetchRecommendations({
  user_id: 'alex',
  liked_movie_ids: [1, 5],  // Movies user liked
  preferred_genres: ['Sci-Fi', 'Action'],
  services: ['Netflix'],
  runtime_min: 90,
  runtime_max: 150
});

// Backend returns ranked movies with explanations
// [
//   {
//     movie_id: 10,
//     title: "Crimson Horizon",
//     score: 0.87,
//     explanation: "Matches your preferred genres: Sci-Fi, Action • Available on Netflix"
//   },
//   ...
// ]
```

### Dataset

Sample dataset (`backend/data/movies_sample.csv`) contains 30 movies with:
- Genres: Sci-Fi, Action, Drama, Comedy, Horror, Romance, Thriller, etc.
- Services: Netflix, Hulu, Amazon Prime, HBO Max
- Years: 2021-2023
- Runtimes: 89-145 minutes

To add more movies, edit the CSV and re-run `python -m ml.train_model`.

## Integration with Python Backend

The app is designed to integrate with a Python recommendation engine backend. All API calls are centralized in `src/services/recommendations.js`.

### Key Integration Functions

Replace the mock implementations with actual API calls:

```javascript
// Current: Mock data
export async function fetchRecommendations(userId) {
  return mockMovies;
}

// Production: REST API call
export async function fetchRecommendations(userId) {
  return fetch(`/api/recommendations/${userId}`)
    .then(r => r.json());
}
```

### API Endpoints to Implement

The following endpoints should be implemented in your Python backend:

1. **GET** `/api/recommendations/:userId` - Fetch personalized recommendations
2. **GET** `/api/watchlist/:userId` - Fetch user's watchlist
3. **POST** `/api/watchlist/:userId` - Add movie to watchlist
4. **DELETE** `/api/watchlist/:userId/:movieId` - Remove from watchlist
5. **PUT** `/api/watchlist/:userId/:movieId/watched` - Mark as watched
6. **POST** `/api/recommendations/:userId/rebuild` - Rebuild recommendations
7. **POST** `/api/feedback/:userId` - Record thumbs up/down feedback
8. **PUT** `/api/preferences/:userId` - Update user preferences
9. **GET** `/api/export/:userId` - Export user data (CSV)
10. **DELETE** `/api/history/:userId` - Clear recommendation history

### Data Models

**Movie Object:**
```javascript
{
  id: string,
  title: string,
  year: number,
  runtime: string,
  synopsis: string,
  genres: string[],
  services: string[],
  posterUrl: string,
  score: number
}
```

**Watchlist Item:**
```javascript
{
  id: string,
  title: string,
  year: number,
  runtime: string,
  synopsis: string,
  genres: string[],
  services: string[],
  posterUrl: string,
  addedDate: string,
  watched: boolean
}
```

## Tech Stack

### Frontend

- **React** 18.2 - UI framework
- **React Router** 6.20 - Client-side routing
- **Tailwind CSS** 3.4 - Utility-first styling
- **Vite** 5.0 - Build tool and dev server
- **Vitest** 1.0 - Testing framework
- **React Testing Library** 14.1 - Component testing
- **Jest-DOM** 6.1 - Custom matchers

### Backend

- **Python** 3.10+
- **FastAPI** 0.104 - Modern async web framework
- **Uvicorn** 0.24 - ASGI server
- **scikit-learn** 1.3 - ML library (TF-IDF, cosine similarity)
- **pandas** 2.1 - Data manipulation
- **numpy** 1.26 - Numerical computing
- **Pydantic** 2.5 - Data validation
- **pytest** 7.4 - Testing

## Key Features for Backend Integration

### 1. Content-Based Filtering
The app expects the Python backend to implement content-based movie recommendations using:
- User preference profiles (genres, languages, services)
- Movie feature vectors (genre, cast, director, plot keywords)
- Similarity scoring algorithms

### 2. Explainability
Each recommendation should include reasoning that can be displayed via the "Why this?" button.

### 3. Preference Learning
The backend should learn from:
- Thumbs up/down feedback
- Movies added to watchlist
- "Not interested" signals
- Watch completion data

### 4. Real-time Filtering
Support query parameters for:
- Genre filtering
- Streaming service filtering
- Year range
- Runtime constraints
- Sorting options (relevance, rating, release date, runtime)

## Design Principles

1. **Mobile-first responsive design**
2. **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation
3. **Performance** - Code splitting, lazy loading, optimized images
4. **Consistency** - Shared components, design tokens, unified spacing
5. **Simplicity** - Clean UI, minimal cognitive load, clear CTAs

## Development Notes

- All placeholder user ID is `'user123'` - replace with actual authentication
- Console logs indicate where backend integration is needed
- Mock data is defined in `services/recommendations.js`
- No external state management (Redux/Zustand) - keep it simple
- Forms use basic validation - add robust validation as needed

## Future Enhancements

- [ ] User authentication (sign up, login, logout)
- [ ] Advanced filtering UI (genre multi-select, year range slider)
- [ ] Explainability modal with detailed reasoning
- [ ] Social features (share recommendations, compare tastes)
- [ ] Search functionality
- [ ] Movie detail pages
- [ ] Rating system (star ratings)
- [ ] Watch history tracking
- [ ] Recommendation scheduling (daily picks at specific time)

## License

Built for students, by students.

