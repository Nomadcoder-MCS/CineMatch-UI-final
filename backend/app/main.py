"""
CineMatch FastAPI Backend

ML-powered movie recommendation API with content-based filtering.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes_recs, routes_watchlist
from ml.recommender import get_recommender

# Create FastAPI app
app = FastAPI(
    title="CineMatch ML Backend",
    description="Content-based movie recommendation API using TF-IDF and genre features",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # Create React App default
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes_recs.router, tags=["recommendations"])
app.include_router(routes_watchlist.router, tags=["watchlist"])


@app.on_event("startup")
async def startup_event():
    """Initialize ML recommender on startup"""
    print("\n" + "="*60)
    print("🎬 CineMatch Backend Starting...")
    print("="*60)
    
    # Initialize recommender (loads artifacts)
    try:
        recommender = get_recommender()
        print(f"✓ Recommender loaded with {len(recommender.movies_meta)} movies")
    except Exception as e:
        print(f"✗ Error loading recommender: {e}")
        print("  Make sure you've run: python -m ml.train_model")
        raise
    
    print("="*60)
    print("✓ Backend ready!")
    print("  API docs: http://localhost:8000/docs")
    print("="*60 + "\n")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CineMatch ML Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

