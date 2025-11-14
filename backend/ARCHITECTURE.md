# CineMatch Backend Architecture

Visual overview of the production ML backend architecture.

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         React Frontend                            │
│                     (localhost:5173)                             │
│                                                                  │
│  Pages: Landing, Home, Watchlist, Profile                       │
│  Components: MovieCard, WatchlistItem, FilterChip              │
│  API Client: src/api/cinematchApi.js                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP/JSON
                         │ fetch()
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                      │
│                     (localhost:8000)                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              API Routes (app/api/)                      │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • POST /api/recommendations                           │    │
│  │    - Input: UserPreferences (genres, services, likes)  │    │
│  │    - Output: List[Recommendation] with scores          │    │
│  │                                                         │    │
│  │  • GET /api/watchlist/{user_id}                        │    │
│  │  • POST /api/watchlist/{user_id}                       │    │
│  │  • DELETE /api/watchlist/{user_id}/{movie_id}          │    │
│  │                                                         │    │
│  │  • GET /health                                          │    │
│  │  • GET /api/genres                                      │    │
│  │  • GET /api/services                                    │    │
│  │  • GET /api/movies/{movie_id}                          │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                         │
│                       ▼                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │       CineMatchRecommender (ml/recommender.py)         │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  Content-Based Filtering:                              │    │
│  │  1. Build user profile from likes/preferences          │    │
│  │  2. Compute cosine similarity with all items           │    │
│  │  3. Apply filters (genres, services, runtime)          │    │
│  │  4. Rank by similarity score                           │    │
│  │  5. Generate explanations                              │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │ loads                                   │
│                       ▼                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         ML Artifacts (ml/artifacts/)                   │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • item_features.npz     (sparse matrix, 60K × 530)    │    │
│  │  • tfidf_vectorizer.pkl  (trained vectorizer)          │    │
│  │  • genre_mlb.pkl         (multi-label binarizer)       │    │
│  │  • numeric_scaler.pkl    (year/runtime scaler)         │    │
│  │  • movies_meta.json      (movie metadata dict)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 📊 Data Pipeline (Offline Training)

```
┌──────────────────────────────────────────────────────────────────┐
│                       Raw Data Sources                           │
└──────────────────────────────────────────────────────────────────┘
          │                                  │
          │ MovieLens 32M                    │ TMDb API (optional)
          │ (87K movies)                     │ (metadata enrichment)
          ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────────┐
│  raw/ml-32m/         │         │  scripts/                │
│  ├── movies.csv      │         │    fetch_tmdb_metadata.py│
│  ├── links.csv       │         └────────┬─────────────────┘
│  ├── ratings.csv     │                  │
│  └── tags.csv        │                  ▼
└──────────┬───────────┘         ┌──────────────────────────┐
           │                     │  raw/tmdb/               │
           │                     │    tmdb_metadata.csv     │
           │                     └────────┬─────────────────┘
           │                              │
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  ml/preprocess_catalog.py    │
           ├──────────────────────────────┤
           │  1. Merge MovieLens + TMDb   │
           │  2. Filter by year/quality   │
           │  3. Clean genres/text        │
           │  4. Add streaming services   │
           │  5. Normalize data           │
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  data/movies_merged.csv      │
           │  (60-87K movies, cleaned)    │
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  ml/train_model.py           │
           ├──────────────────────────────┤
           │  Feature Engineering:        │
           │  • TF-IDF on overview        │
           │    (unigrams + bigrams)      │
           │  • Multi-hot genre encoding  │
           │  • Scaled numeric features   │
           │    (year, runtime)           │
           │  • Sparse matrix concat      │
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐
           │  ml/artifacts/*.{npz,pkl,json}│
           │  (ML models & metadata)      │
           └──────────────────────────────┘
```

## 🔄 Request Flow Example

**User Request:** "Show me sci-fi action movies on Netflix"

```
1. Frontend (HomePage.jsx)
   ├─ User selects genres: ["sci-fi", "action"]
   ├─ User selects service: ["Netflix"]
   └─ Calls: fetchRecommendations({ preferred_genres: [...], services: [...] })

2. API Client (cinematchApi.js)
   └─ POST http://localhost:8000/api/recommendations
      Body: { user_id: "alex", preferred_genres: ["sci-fi", "action"], services: ["Netflix"] }

3. FastAPI Route (app/api/routes_recs.py)
   └─ POST /api/recommendations handler
      ├─ Parse UserPreferences (Pydantic validation)
      ├─ Call: recommender.recommend(prefs, top_k=20)
      └─ Return: RecommendationsResponse

4. ML Recommender (ml/recommender.py)
   └─ CineMatchRecommender.recommend()
      ├─ Build user profile vector
      │  ├─ Average liked movie vectors
      │  └─ Nudge toward preferred genres
      │
      ├─ Compute similarities
      │  └─ cosine_similarity(user_profile, all_items)
      │
      ├─ Apply filters
      │  ├─ Exclude already liked/disliked
      │  ├─ Filter by genres (sci-fi, action)
      │  └─ Filter by service (Netflix)
      │
      ├─ Rank by score
      │  └─ Top 20 items
      │
      ├─ Generate explanations
      │  └─ "Matches your preferred genres: sci-fi, action"
      │
      └─ Return: List[dict] with movie metadata + scores

5. FastAPI Route
   └─ Serialize to JSON
      {
        "recommendations": [
          {
            "movie_id": 862,
            "title": "Blade Runner 2049",
            "year": 2017,
            "genres": ["sci-fi", "thriller"],
            "services": ["Netflix"],
            "score": 0.87,
            "explanation": "Matches your preferred genres: sci-fi"
          },
          ...
        ]
      }

6. Frontend
   ├─ Receive JSON response
   ├─ Map to MovieCard components
   └─ Render in grid layout
```

## 🧮 Feature Engineering Details

### Text Features (TF-IDF)
```python
TfidfVectorizer(
    max_features=500,        # Top 500 terms by TF-IDF
    ngram_range=(1, 2),      # Unigrams + bigrams
    stop_words='english',    # Remove common words
    min_df=1                 # Must appear in at least 1 doc
)

Input:  "A cowboy doll is profoundly threatened and jealous when a 
         new spaceman figure supplants him as top toy in a boy's room."
Output: Sparse vector [500 dims] with TF-IDF scores for:
        ["cowboy", "doll", "profoundly threatened", "spaceman", ...]
```

### Genre Features (Multi-Hot Encoding)
```python
MultiLabelBinarizer()

Input:  genres = "Action|Sci-Fi|Thriller"
Output: One-hot vector [~25 dims]:
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, ...]
         ^        ^              ^
         |        |              |
      Action   Sci-Fi        Thriller
```

### Numeric Features (Scaled)
```python
StandardScaler()

Input:  year=2017, runtime=163
Output: Scaled values:
        year_scaled = (2017 - mean_year) / std_year
        runtime_scaled = (163 - mean_runtime) / std_runtime
```

### Final Feature Matrix
```
item_features = [TF-IDF | Genre | Year | Runtime]
                 -------   -----   ----   -------
                 500 dims  25 dims  1 dim   1 dim
                 
Total: 527 dimensions per movie
Shape: (62,485 movies × 527 features) = sparse matrix
```

## 🔍 Similarity Computation

**User Profile Vector:**
```
If user liked movies: [862, 13, 89]
  user_profile = mean([
    item_features[862],   # Blade Runner
    item_features[13],    # The Matrix
    item_features[89]     # Inception
  ])
```

**Cosine Similarity:**
```python
from sklearn.metrics.pairwise import cosine_similarity

similarities = cosine_similarity(
    user_profile.reshape(1, -1),  # (1 × 527)
    item_features                  # (62485 × 527)
)
# Result: (1 × 62485) array of similarity scores [0, 1]
```

**Ranking:**
```python
# Sort by similarity, exclude already liked/disliked
top_indices = np.argsort(similarities[0])[::-1][:100]

# Apply filters (genres, services, runtime)
filtered = [i for i in top_indices if passes_filters(i)]

# Return top 20
recommendations = filtered[:20]
```

## 📈 Performance Characteristics

### Training (Offline)
- **Preprocessing**: 30-120 seconds (60K movies)
- **TF-IDF fitting**: 10-30 seconds
- **Feature matrix construction**: 10-20 seconds
- **Save artifacts**: 2-5 seconds
- **Total**: 2-3 minutes

### Inference (Online)
- **Load artifacts**: ~1 second (startup only)
- **Build user profile**: <1 ms
- **Compute similarities**: 10-50 ms (60K movies)
- **Filter & rank**: 5-10 ms
- **Generate explanations**: <1 ms
- **Total per request**: **15-60 ms**

### Memory Usage
- **Feature matrix**: ~500 MB (sparse)
- **Vectorizer objects**: ~50 MB
- **Movie metadata**: ~20 MB
- **Total RAM**: ~600 MB

### Storage
- **Raw data**: ~900 MB (MovieLens + TMDb)
- **Processed data**: ~50 MB (movies_merged.csv)
- **ML artifacts**: ~500 MB
- **Total disk**: ~1.5 GB

## 🔐 API Authentication

**Current:** None (development)

**Production TODO:**
- JWT tokens for user authentication
- API keys for rate limiting
- OAuth integration (Google, Facebook)
- User session management

## 📊 Scalability

### Current Capacity
- ✅ 60K movies: Excellent performance
- ✅ 100K movies: Good performance
- ⚠️ 500K movies: Needs optimization
- ❌ 1M+ movies: Requires approximate methods

### Scaling Strategies

**For 100K-500K movies:**
1. Increase feature dimensions (max_features=1000-2000)
2. Use more aggressive filtering (min_df=5-10)
3. Add caching for popular queries (Redis)

**For 500K-1M+ movies:**
1. Approximate Nearest Neighbors (Annoy, FAISS)
2. Candidate generation + reranking
3. Distributed training (Dask, Ray)
4. Sharded storage (by genre, year)

**For personalization:**
1. Collaborative filtering (matrix factorization)
2. Deep learning (two-tower models)
3. User embeddings + item embeddings
4. Real-time retraining

## 🧪 Testing

### Unit Tests (`backend/tests/`)

```python
# Test recommender
test_recommender.py
  • test_load_recommender()
  • test_cold_start_recommendations()
  • test_recommendations_with_likes()
  • test_genre_filtering()
  • test_runtime_filtering()
  • test_get_movie_metadata()

# Test API
test_api.py
  • test_health_endpoint()
  • test_recommendations_endpoint()
  • test_watchlist_operations()
  • test_genres_endpoint()
  • test_services_endpoint()
```

Run with:
```bash
pytest tests/ -v
```

## 📚 Dependencies

### Core
- **fastapi** (0.110+): Web framework
- **uvicorn** (0.27+): ASGI server
- **pydantic** (2.6+): Data validation

### ML/Data
- **pandas** (2.2+): Data manipulation
- **numpy** (1.26+): Numerical computing
- **scikit-learn** (1.4+): ML algorithms
- **scipy** (1.11+): Sparse matrices

### Optional
- **python-dotenv**: Environment variables
- **requests**: TMDb API client
- **pytest**: Testing
- **httpx**: Async HTTP client

## 🚀 Deployment Checklist

- [ ] Train model with full TMDb data
- [ ] Set `require_tmdb=True` for quality filtering
- [ ] Increase `max_features` to 1000-2000
- [ ] Add Redis caching for popular queries
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Containerize with Docker
- [ ] Deploy to cloud (AWS, GCP, Azure)
- [ ] Add monitoring (Prometheus, Grafana)
- [ ] Add logging (structured JSON logs)
- [ ] Set up authentication (JWT)
- [ ] Configure CORS for production domain
- [ ] Set up CDN for static assets
- [ ] Add rate limiting
- [ ] Set up backup & recovery
- [ ] Performance testing & profiling

---

**Architecture designed for:**
- ✅ Fast iteration during development
- ✅ Easy debugging and testing
- ✅ Clear separation of concerns
- ✅ Straightforward scaling path
- ✅ Production-ready foundations

