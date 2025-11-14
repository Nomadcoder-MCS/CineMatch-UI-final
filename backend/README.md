# CineMatch ML Backend

Content-based movie recommendation engine using Python, FastAPI, and scikit-learn.

## Architecture

### ML Approach: Content-Based Filtering

1. **Feature Engineering**
   - **TF-IDF Vectorization**: Convert movie overviews to TF-IDF vectors (500 features, unigrams + bigrams)
   - **Genre Multi-Hot Encoding**: Binary encoding of all genres per movie
   - **Numeric Features**: Scaled year and runtime

2. **User Profile Building**
   - If user has liked movies: average their feature vectors
   - If no history: build profile from explicit preferences (genres/services)
   - Cold start: use average of all movies

3. **Ranking**
   - Compute cosine similarity between user profile and all movies
   - Apply filters: runtime, genres, services, exclude liked/disliked
   - Return top-k ranked by similarity score

4. **Explainability**
   - Generate human-readable explanations for each recommendation
   - Based on genre matches, service availability, and similarity

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── api/
│   │   ├── routes_recs.py   # Recommendation endpoints
│   │   └── routes_watchlist.py  # Watchlist CRUD endpoints
│   └── schemas/
│       ├── recs.py          # Pydantic models for recommendations
│       └── watchlist.py     # Pydantic models for watchlist
├── ml/
│   ├── train_model.py       # Training pipeline (build artifacts)
│   ├── recommender.py       # CineMatchRecommender class
│   └── artifacts/           # Saved model artifacts (generated)
│       ├── item_features.npz
│       ├── tfidf_vectorizer.pkl
│       ├── genre_mlb.pkl
│       ├── numeric_scaler.pkl
│       └── movies_meta.json
├── data/
│   └── movies_sample.csv    # Sample movie dataset (30 movies)
├── tests/
│   ├── test_recommender.py  # ML tests
│   └── test_api.py          # API tests
└── requirements.txt
```

## Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Train ML Model

```bash
# From backend/ directory
python -m ml.train_model
```

This will:
- Load `data/movies_sample.csv`
- Build TF-IDF, genre, and numeric features
- Save artifacts to `ml/artifacts/`

Output:
```
============================================================
CineMatch Content-Based Recommender - Training
============================================================
Loading movies from backend/data/movies_sample.csv...
Loaded 30 movies
Building TF-IDF features from overviews...
TF-IDF matrix shape: (30, 500)
Building genre features...
Genre matrix shape: (30, 25)
...
✓ All artifacts saved successfully!
```

### 3. Run FastAPI Server

```bash
# From backend/ directory
uvicorn app.main:app --reload --port 8000
```

Server will start on `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

### 4. Run Tests

```bash
# From backend/ directory
pytest tests/ -v
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "num_items": 30,
  "service": "cinematch-ml-backend"
}
```

### Get Recommendations

```http
POST /api/recommendations
```

Request body:
```json
{
  "user_id": "alex",
  "liked_movie_ids": [1, 5],
  "disliked_movie_ids": [3],
  "preferred_genres": ["Sci-Fi", "Action"],
  "services": ["Netflix"],
  "runtime_min": 90,
  "runtime_max": 150
}
```

Response:
```json
{
  "recommendations": [
    {
      "movie_id": 10,
      "title": "Crimson Horizon",
      "year": 2023,
      "runtime": 145,
      "overview": "An epic space opera...",
      "genres": ["Sci-Fi", "Action", "Adventure"],
      "services": ["Netflix", "HBO Max"],
      "score": 0.87,
      "explanation": "Matches your preferred genres: Sci-Fi, Action • Available on Netflix"
    }
  ],
  "count": 20,
  "user_id": "alex"
}
```

### Watchlist Operations

```http
GET /api/watchlist/{user_id}
POST /api/watchlist/{user_id}
DELETE /api/watchlist/{user_id}/{movie_id}
PUT /api/watchlist/{user_id}/{movie_id}/watched
```

### Get Genres/Services

```http
GET /api/genres
GET /api/services
```

## Development

### Adding More Movies

Edit `data/movies_sample.csv` and re-run training:

```bash
python -m ml.train_model
```

### Improving Recommendations

Current model uses simple content-based filtering. Improvements:

1. **Add More Features**
   - Cast, director, plot keywords
   - User ratings, popularity scores
   - Release date seasonality

2. **Collaborative Filtering**
   - Matrix factorization (SVD, ALS)
   - Neural collaborative filtering

3. **Hybrid Approaches**
   - Combine content + collaborative
   - Ensemble multiple models

4. **Personalization**
   - Track user interactions over time
   - Decay older preferences
   - A/B test recommendation strategies

### Production Considerations

**Database**: Replace in-memory watchlist storage with PostgreSQL/MongoDB

```python
# TODO in routes_watchlist.py
from sqlalchemy import create_engine
# ... implement proper DB models
```

**Caching**: Add Redis for frequently accessed recommendations

**Logging**: Add structured logging for monitoring

**Scaling**: Deploy with Docker + Kubernetes, use load balancer

## Troubleshooting

### Error: "artifacts not found"

Run training first:
```bash
python -m ml.train_model
```

### CORS errors from frontend

Check CORS settings in `app/main.py`:
```python
allow_origins=["http://localhost:5173", ...]
```

### Import errors

Make sure you're in the `backend/` directory and have activated venv:
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
```

## License

MIT

