# CineMatch Backend - Quick Reference Card

## 🚀 Setup Commands

### First Time Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python setup_pipeline.py               # Interactive wizard
```

### Manual Setup (MovieLens Only)
```bash
cd backend
source .venv/bin/activate
python -m ml.preprocess_catalog        # 30-60 sec
python -m ml.train_model               # 2-3 min
uvicorn app.main:app --reload --port 8000
```

### Full Setup (With TMDb)
```bash
# Get token: https://www.themoviedb.org/settings/api
echo "TMDB_BEARER_TOKEN=your_token" > .env
python -m scripts.fetch_tmdb_metadata  # 15 sec (500 movies) or 6 hrs (87K)
python -m ml.preprocess_catalog
python -m ml.train_model
uvicorn app.main:app --reload --port 8000
```

---

## 📁 File Structure

```
backend/
├── raw/ml-32m/          ← MovieLens dataset (87K movies)
├── data/movies_merged.csv ← Processed data for ML
├── ml/artifacts/        ← Trained models
├── app/main.py          ← FastAPI server
└── setup_pipeline.py    ← Setup wizard
```

---

## 🔄 Data Pipeline

```
MovieLens CSV (87K)
    ↓
[Optional] Fetch TMDb
    ↓
Preprocess → data/movies_merged.csv (60K)
    ↓
Train → ml/artifacts/*.pkl
    ↓
Load into FastAPI → Serve recommendations
```

---

## 🛠️ Common Commands

```bash
# Preprocessing
python -m ml.preprocess_catalog

# Training
python -m ml.train_model

# Start server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Fetch TMDb (test mode)
python -m scripts.fetch_tmdb_metadata

# Full pipeline
python setup_pipeline.py
```

---

## 🌐 API Endpoints

### Core Endpoints
```
POST /api/recommendations          Get personalized recommendations
GET  /api/watchlist/{user_id}     Get user's watchlist
POST /api/watchlist/{user_id}     Add to watchlist
GET  /health                       Health check
GET  /api/genres                   List all genres
GET  /api/services                 List all services
GET  /api/movies/{movie_id}        Get movie details
```

### Example Request
```bash
curl -X POST http://localhost:8000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "alex",
    "preferred_genres": ["action", "sci-fi"],
    "services": ["Netflix"],
    "runtime_min": 90,
    "runtime_max": 150
  }'
```

---

## 📊 Dataset Stats

| Source | Movies | Time | Quality |
|--------|--------|------|---------|
| MovieLens only | ~60K | 2 min | Good |
| + TMDb (500) | ~450 | 5 min | Better |
| + TMDb (full 87K) | ~45K | 6 hrs | Excellent |

---

## ⚙️ Configuration

### Preprocessing (`ml/preprocess_catalog.py` line 185)
```python
df = clean_and_filter(
    df, 
    min_year=1980,        # Filter old movies
    require_tmdb=False    # True = only TMDb entries
)
```

### Training (`ml/train_model.py` line 55)
```python
vectorizer = TfidfVectorizer(
    max_features=500,     # Increase to 1000-2000
    ngram_range=(1, 2),   # Try (1, 3) for trigrams
    min_df=1              # Increase to 5-10
)
```

### TMDb Fetch (`scripts/fetch_tmdb_metadata.py` line 13)
```python
MAX_IDS = 500  # Change to None for full fetch
```

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| `movies_merged.csv not found` | Run: `python -m ml.preprocess_catalog` |
| `Missing TMDB_BEARER_TOKEN` | Create `.env` with your token |
| `ModuleNotFoundError` | Activate venv: `source .venv/bin/activate` |
| Poor recommendations | Fetch TMDb or increase `max_features` |
| Slow processing | Normal: Preprocessing 30-120s, Training 2-5 min |

---

## 🔄 Maintenance Schedule

### Weekly (if using TMDb)
```bash
python -m scripts.fetch_tmdb_metadata  # Refresh metadata
python -m ml.preprocess_catalog        # Reprocess
python -m ml.train_model               # Retrain
# Restart server
```

### Monthly
Check for new MovieLens releases, update `raw/ml-32m/`, run full pipeline.

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [`DATA_PIPELINE.md`](DATA_PIPELINE.md) | Complete pipeline guide |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture |
| [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) | Migration from toy dataset |
| [`UPGRADE_COMPLETE.md`](UPGRADE_COMPLETE.md) | Quick start guide |
| [`backend/README.md`](README.md) | API documentation |

---

## ✅ Testing Checklist

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Get recommendations
curl -X POST http://localhost:8000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","preferred_genres":["action"]}'

# 3. Run pytest
pytest tests/ -v

# 4. Test frontend
npm run dev  # Visit http://localhost:5173
```

---

## 🎯 Quick Wins

### Improve Recommendations
1. Fetch TMDb data (1-time setup)
2. Increase `max_features` to 1000-2000
3. Set `min_year=2000` for recent movies
4. Set `require_tmdb=True` for quality

### Performance
1. Use Redis for caching popular queries
2. Increase `min_df` to 5-10 in TfidfVectorizer
3. Pre-compute recommendations for common queries

### User Experience
1. Add full-text search
2. Add "Similar movies" feature
3. Show trending movies
4. Add user ratings

---

## 🔗 Useful Links

- MovieLens: https://grouplens.org/datasets/movielens/
- TMDb API: https://www.themoviedb.org/settings/api
- FastAPI docs: http://localhost:8000/docs (when running)
- scikit-learn: https://scikit-learn.org/

---

## 📞 Need Help?

1. Check [`DATA_PIPELINE.md`](DATA_PIPELINE.md) troubleshooting section
2. Review [`ARCHITECTURE.md`](ARCHITECTURE.md) for system design
3. See [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) for configuration examples

---

**Print this page for quick reference while developing!** 📄

