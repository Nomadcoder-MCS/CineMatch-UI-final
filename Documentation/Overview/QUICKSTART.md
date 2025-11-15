# CineMatch - Quick Start Guide

Get the full-stack CineMatch app (React UI + Python ML backend) running in 5 minutes.

## Prerequisites

- Node.js 18+ 
- Python 3.10+

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate  # macOS/Linux
# OR
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Train the ML model (builds artifacts)
python -m ml.train_model
```

You should see:
```
============================================================
CineMatch Content-Based Recommender - Training
============================================================
Loading movies from backend/data/movies_sample.csv...
Loaded 30 movies
...
✓ All artifacts saved successfully!
```

## Step 2: Start Backend Server (30 seconds)

```bash
# From backend/ directory, with venv activated
uvicorn app.main:app --reload --port 8000
```

You should see:
```
============================================================
🎬 CineMatch Backend Starting...
============================================================
✓ Recommender loaded with 30 movies
============================================================
✓ Backend ready!
  API docs: http://localhost:8000/docs
============================================================

INFO:     Uvicorn running on http://127.0.0.1:8000
```

Backend is now live! Keep this terminal running.

## Step 3: Frontend Setup (1 minute)

Open a **new terminal** (keep backend running):

```bash
# Navigate to project root
cd /path/to/CineMatch-UI2

# Install dependencies
npm install

# Start dev server
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Open App

Visit **http://localhost:5173** in your browser.

You should see the CineMatch landing page! 🎉

## Testing the Integration

1. **Landing Page** (`/`)
   - Click "Get started" → should navigate to Home page

2. **Home Page** (`/home`)
   - Should load ML-generated recommendations from backend
   - If you see movies, the backend is working! ✓
   - If you see an alert "Could not load recommendations", check:
     - Is backend running on port 8000?
     - Check browser console for CORS errors

3. **Add to Watchlist**
   - Click "+ Watchlist" on any movie
   - Navigate to `/watchlist`
   - Should see the movie you added ✓

4. **Test API Directly**
   - Visit http://localhost:8000/docs
   - Try the `/health` endpoint → should return `{"status": "ok"}`
   - Try `POST /api/recommendations` with:
     ```json
     {
       "user_id": "test",
       "preferred_genres": ["Sci-Fi", "Action"],
       "services": ["Netflix"]
     }
     ```
   - Should return 20 movie recommendations ✓

## Running Tests

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

Should see:
```
tests/test_api.py::test_health PASSED
tests/test_recommender.py::test_recommender_loads PASSED
...
============ 15 passed in 2.5s ============
```

### Frontend Tests

```bash
# From project root
npm test
```

Should see:
```
✓ src/tests/LandingPage.test.jsx (10)
✓ src/tests/HomePage.test.jsx (12)
✓ src/tests/WatchlistPage.test.jsx (15)
...
Test Files  5 passed (5)
Tests  83 passed (83)
```

## Troubleshooting

### Backend errors

**Error: "artifacts not found"**
- Solution: Run `python -m ml.train_model` first

**Error: "Module not found"**
- Solution: Make sure you're in `backend/` directory and venv is activated

**Port 8000 already in use**
- Solution: Kill existing process or change port in `uvicorn` command

### Frontend errors

**Error: "Could not load recommendations"**
- Solution: Make sure backend is running on http://localhost:8000
- Check `npm run dev` output for the frontend port (usually 5173)

**CORS errors in browser console**
- Solution: Check `backend/app/main.py` CORS settings include your frontend port

**Tests failing**
- Solution: Make sure backend is NOT running during frontend tests (they use mocks)

## Next Steps

- Add more movies to `backend/data/movies_sample.csv` and retrain
- Explore ML backend code in `backend/ml/recommender.py`
- Customize UI colors in `tailwind.config.js`
- Check API docs at http://localhost:8000/docs
- Read `backend/README.md` for ML implementation details
- Read `TESTING.md` for comprehensive test guide

## Architecture Summary

```
Browser (http://localhost:5173)
    ↓
React App (Vite dev server)
    ↓
src/api/cinematchApi.js
    ↓
HTTP POST http://localhost:8000/api/recommendations
    ↓
FastAPI Server (backend/app/main.py)
    ↓
ML Recommender (backend/ml/recommender.py)
    ↓
Returns 20 ranked movies with explanations
```

Enjoy building with CineMatch! 🎬

