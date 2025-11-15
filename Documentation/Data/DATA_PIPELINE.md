# CineMatch Data Pipeline: MovieLens 32M + TMDb

Complete guide for processing MovieLens 32M dataset with TMDb metadata enrichment.

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ RAW DATA                                                    │
├─────────────────────────────────────────────────────────────┤
│  raw/ml-32m/                                                │
│    ├── movies.csv          (87K movies)                     │
│    ├── links.csv           (TMDb/IMDb IDs)                  │
│    ├── ratings.csv         (32M ratings - optional)         │
│    └── tags.csv            (User tags - optional)           │
│                                                             │
│  raw/tmdb/                                                  │
│    └── tmdb_metadata.csv   (Fetched from TMDb API)         │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ PREPROCESSING                                               │
├─────────────────────────────────────────────────────────────┤
│  python -m ml.preprocess_catalog                            │
│                                                             │
│  • Merge MovieLens + TMDb                                   │
│  • Filter by year, quality                                  │
│  • Add streaming services (mock)                            │
│  • Clean and normalize                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ PROCESSED DATA                                              │
├─────────────────────────────────────────────────────────────┤
│  data/movies_merged.csv    (Clean, ML-ready)                │
│                                                             │
│  Columns:                                                   │
│    - movieId, title, year, runtime                          │
│    - genres, overview                                       │
│    - services (Netflix, Hulu, etc.)                         │
│    - popularity, vote_count, vote_average                   │
│    - keywords, cast_top, director                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ ML TRAINING                                                 │
├─────────────────────────────────────────────────────────────┤
│  python -m ml.train_model                                   │
│                                                             │
│  • TF-IDF vectorization (overview)                          │
│  • Genre encoding                                           │
│  • Numeric features (year, runtime)                         │
│  • Save artifacts                                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ ML ARTIFACTS                                                │
├─────────────────────────────────────────────────────────────┤
│  ml/artifacts/                                              │
│    ├── item_features.npz                                    │
│    ├── tfidf_vectorizer.pkl                                 │
│    ├── genre_mlb.pkl                                        │
│    ├── numeric_scaler.pkl                                   │
│    └── movies_meta.json                                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ FASTAPI SERVER                                              │
├─────────────────────────────────────────────────────────────┤
│  uvicorn app.main:app --reload --port 8000                  │
│                                                             │
│  Endpoints:                                                 │
│    POST /api/recommendations                                │
│    GET  /api/watchlist/{user_id}                            │
│    POST /api/watchlist/{user_id}                            │
│    GET  /health                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Step 1: Preprocess Data (Without TMDb)

Start with MovieLens-only data:

```bash
cd backend
python -m ml.preprocess_catalog
```

This processes ~87K movies in ~30 seconds.

**Output**: `data/movies_merged.csv` with MovieLens data only.

### Step 2: Train ML Model

```bash
python -m ml.train_model
```

This builds TF-IDF features and saves artifacts.

**Output**: `ml/artifacts/*.{npz,pkl,json}`

### Step 3: Start API Server

```bash
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs

✅ **Your backend is now live with 87K movies!**

---

## 🎬 Optional: Add TMDb Metadata (Recommended)

TMDb provides high-quality metadata: overviews, cast, keywords, ratings.

### Step 1: Get TMDb API Key

1. Sign up at https://www.themoviedb.org/
2. Go to Settings → API
3. Request API key (free for non-commercial use)
4. Copy your **API Read Access Token** (Bearer token)

### Step 2: Configure Environment

Create `.env` file in `backend/`:

```bash
TMDB_BEARER_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJhdWQ...your_token_here
```

### Step 3: Fetch TMDb Data

**Test mode** (500 movies):

```bash
python -m scripts.fetch_tmdb_metadata
```

**Production mode** (all 87K movies):

Edit `scripts/fetch_tmdb_metadata.py`:
```python
MAX_IDS = None  # Change from 500 to None
```

Then run:
```bash
python -m scripts.fetch_tmdb_metadata
```

⚠️ **This takes ~5-6 hours** for 87K movies (respects TMDb rate limits).

**Output**: `raw/tmdb/tmdb_metadata.csv`

### Step 4: Reprocess with TMDb

```bash
python -m ml.preprocess_catalog
```

Now `data/movies_merged.csv` includes TMDb enrichment!

### Step 5: Retrain Model

```bash
python -m ml.train_model
```

### Step 6: Restart Server

```bash
uvicorn app.main:app --reload --port 8000
```

✅ **Now powered by high-quality TMDb metadata!**

---

## 📋 Data Schema

### Raw Data

**raw/ml-32m/movies.csv**
```csv
movieId,title,genres
1,Toy Story (1995),Adventure|Animation|Children|Comedy|Fantasy
```

**raw/ml-32m/links.csv**
```csv
movieId,imdbId,tmdbId
1,0114709,862
```

**raw/tmdb/tmdb_metadata.csv** (after fetching)
```csv
tmdb_id,title,release_date,runtime,popularity,vote_count,vote_average,genres,overview,keywords,cast_top,director
862,Toy Story,1995-11-22,81,21.946,3000,7.9,animation|comedy|family,"Led by Woody...",computer animation|cowboy,Tom Hanks|Tim Allen|Don Rickles,John Lasseter
```

### Processed Data

**data/movies_merged.csv**
```csv
movieId,tmdbId,imdbId,title,year,genres,overview,runtime,popularity,vote_count,vote_average,keywords,cast_top,director,services
1,862,0114709,Toy Story,1995,adventure|animation|children|comedy|fantasy,"Led by Woody...",81,21.946,3000,7.9,computer animation|cowboy,Tom Hanks|Tim Allen|Don Rickles,John Lasseter,Netflix|Disney+
```

---

## ⚙️ Configuration Options

### preprocess_catalog.py

```python
def main():
    df = load_movielens_data()
    tmdb = load_tmdb_metadata()
    df = merge_with_tmdb(df, tmdb)
    
    # Configuration:
    df = clean_and_filter(
        df, 
        min_year=1980,        # Filter movies before this year
        require_tmdb=False    # True = only movies with TMDb data
    )
    
    df = add_streaming_services(
        df, 
        sample_fraction=0.3   # 30% of movies get extra services
    )
    
    save_processed_data(df)
```

### train_model.py

```python
def build_tfidf_features(df):
    vectorizer = TfidfVectorizer(
        max_features=500,     # Increase to 1000+ for larger dataset
        ngram_range=(1, 2),   # Unigrams + bigrams
        stop_words='english',
        min_df=1              # Increase to 5-10 for better quality
    )
    ...
```

---

## 📊 Dataset Statistics

### MovieLens 32M (as of 2020)

- **Movies**: 87,585
- **Ratings**: 32,202,126
- **Users**: 162,541
- **Time span**: 1995-2020
- **Avg ratings per movie**: 367
- **Genres**: 20 unique

### After Preprocessing

**Without TMDb**:
- Movies: ~60K (filtered by year >= 1980)
- All have genres and basic metadata

**With TMDb**:
- Movies: ~45K (high-quality with full metadata)
- Includes overviews, cast, directors, keywords
- Quality scores (vote_average, vote_count)

---

## 🛠️ Troubleshooting

### Error: "data/movies_merged.csv not found"

**Solution**: Run preprocessing first:
```bash
python -m ml.preprocess_catalog
```

### Error: "Missing TMDB_BEARER_TOKEN"

**Solution**: Add to `.env` file:
```bash
TMDB_BEARER_TOKEN=your_token_here
```

### TMDb fetch is slow

**Expected**: 87K movies takes 5-6 hours (20ms per movie + retries)

**Speed up**:
- Start with `MAX_IDS = 1000` for testing
- Run overnight for full fetch
- Or use pre-fetched TMDb data if available

### Low recommendation quality

**Improvements**:
1. Fetch TMDb metadata (much better overviews)
2. Increase `max_features` in TfidfVectorizer
3. Add user ratings from `ratings.csv`
4. Implement collaborative filtering

---

## 🔄 Maintenance

### Updating Data

**Monthly** (when TMDb data changes):
```bash
python -m scripts.fetch_tmdb_metadata  # Refetch TMDb
python -m ml.preprocess_catalog        # Reprocess
python -m ml.train_model               # Retrain
```

**Yearly** (new MovieLens release):
1. Download new MovieLens dataset
2. Replace `raw/ml-32m/`
3. Run full pipeline

### Monitoring

Check `ml/artifacts/movies_meta.json` for movie count:
```bash
python -c "import json; print(len(json.load(open('ml/artifacts/movies_meta.json'))))"
```

---

## 📈 Next Steps

### Production Improvements

1. **Better Streaming Data**
   - Integrate JustWatch API for real service availability
   - Update weekly

2. **Collaborative Filtering**
   - Use `ratings.csv` for user-user similarity
   - Matrix factorization (ALS, SVD)
   - Hybrid content + collaborative

3. **Real-time Updates**
   - Incremental training for new movies
   - Redis cache for popular queries
   - Background job for weekly retraining

4. **A/B Testing**
   - Track recommendation CTR
   - Compare TF-IDF vs BERT embeddings
   - Optimize for user engagement

### Scale

Current setup handles 87K movies easily. For 1M+ movies:
- Increase `max_features` to 2000-5000
- Use approximate nearest neighbors (Annoy, FAISS)
- Distribute training with Dask/Ray
- Use sparse matrix ops throughout

---

## 📝 License & Attribution

- MovieLens 32M: F. Maxwell Harper and Joseph A. Konstan. 2015. The MovieLens Datasets.
- TMDb: Data from The Movie Database (TMDb). This product uses the TMDb API but is not endorsed or certified by TMDb.

---

**Questions?** Check `backend/README.md` or open an issue!

