"""
Recommendations API routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, UserPreferences as DBUserPreferences, UserFeedback
from app.deps import get_current_user
from app.schemas.recs import UserPreferences, RecommendationsResponse, Recommendation
from ml.recommender import get_recommender, UserPreferences as MLUserPrefs
from enum import Enum
from typing import Optional

router = APIRouter()


class RecMode(str, Enum):
    """Recommendation mode"""
    because_liked = "because_liked"
    trending = "trending"
    genre = "genre"
    service = "service"
    year = "year"
    runtime = "runtime"


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    recommender = get_recommender()
    return {
        "status": "ok",
        "num_items": len(recommender.movies_meta),
        "service": "cinematch-ml-backend"
    }


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
    """
    Get personalized movie recommendations for the current user
    
    **How per-user recommendations work:**
    
    1. **Authentication:**
       - Requires X-User-Id header (via get_current_user dependency)
       - Returns 401 if user not found
       - No default user fallback
    
    2. **Load User Preferences (from database):**
       - preferred_genres: e.g., ["action", "sci-fi"]
       - services: e.g., ["Netflix", "Hulu"]
       - runtime_min, runtime_max: e.g., 90-150 minutes
    
    3. **Load User Feedback (from database):**
       - liked_movie_ids: Movies user gave thumbs up
       - disliked_movie_ids: Movies user gave thumbs down
       - not_interested_ids: Movies user marked "not interested" (hard exclusion)
    
    4. **Build User Profile (in ML recommender):**
       - Strategy 1: Average feature vectors of liked movies
       - Strategy 2: Synthetic profile from preferred genres
       - Strategy 3: Cold-start fallback (average of all movies)
    
    5. **Apply Filters:**
       - Exclude not_interested_ids (NEVER show these)
       - Exclude already liked/disliked (avoid duplicates)
       - Filter by genres, services, runtime (from preferences)
    
    6. **Return Recommendations:**
       - Ranked by cosine similarity to user profile
       - Includes overview, poster_url, score, explanation
    
    **No hard-coded values are used.** All data comes from the database.
    If a user has no preferences or feedback, the recommender uses a
    cold-start fallback (documented in recommender.py).
    """
    try:
        recommender = get_recommender()
        
        # Load user preferences from database
        db_prefs = db.query(DBUserPreferences).filter(
            DBUserPreferences.user_id == current_user.id
        ).first()
        
        # Parse preferences (pipe-separated strings → lists)
        preferred_genres = []
        services = []
        runtime_min = 80
        runtime_max = 180
        
        if db_prefs:
            preferred_genres = db_prefs.preferred_genres.split('|') if db_prefs.preferred_genres else []
            services = db_prefs.services.split('|') if db_prefs.services else []
            runtime_min = db_prefs.runtime_min or 80
            runtime_max = db_prefs.runtime_max or 180
        
        # Load user feedback (likes, dislikes, and not_interested)
        # Semantics:
        # - likes: Positive preference, used to build user profile
        # - dislikes: Negative signal, can down-weight but not hard exclude
        # - not_interested: Hard exclusion - these movies should NEVER appear
        liked_movie_ids = []
        disliked_movie_ids = []
        not_interested_ids = []
        
        feedback_records = db.query(UserFeedback).filter(
            UserFeedback.user_id == current_user.id
        ).all()
        
        for feedback in feedback_records:
            if feedback.signal == "like":
                liked_movie_ids.append(feedback.movie_id)
            elif feedback.signal == "dislike":
                disliked_movie_ids.append(feedback.movie_id)
            elif feedback.signal == "not_interested":
                not_interested_ids.append(feedback.movie_id)
        
        print(f"\n{'='*60}")
        print(f"Building recommendations for user: {current_user.name} (ID: {current_user.id})")
        print(f"  Mode: {mode}")
        if mode == RecMode.genre and genre:
            print(f"  Filtering by genre: {genre}")
        if mode == RecMode.service and service:
            print(f"  Filtering by service: {service}")
        if mode == RecMode.year and year_bucket:
            print(f"  Filtering by year bucket: {year_bucket}")
        if mode == RecMode.runtime and runtime_bucket:
            print(f"  Filtering by runtime bucket: {runtime_bucket}")
        print(f"  Preferred genres: {preferred_genres}")
        print(f"  Services: {services}")
        print(f"  Runtime: {runtime_min}-{runtime_max} min")
        print(f"  Liked movies: {len(liked_movie_ids)}")
        print(f"  Disliked movies: {len(disliked_movie_ids)}")
        print(f"  Not interested (excluded): {len(not_interested_ids)}")
        print(f"{'='*60}")
        
        # Build ML preferences object
        ml_prefs = MLUserPrefs(
            user_id=str(current_user.id),
            liked_movie_ids=liked_movie_ids,
            disliked_movie_ids=disliked_movie_ids,
            not_interested_ids=not_interested_ids,  # Hard exclusion set
            preferred_genres=preferred_genres,
            services=services,
            runtime_min=runtime_min,
            runtime_max=runtime_max
        )
        
        # Get recommendations from ML model with mode-specific params
        recs = recommender.recommend(
            ml_prefs, 
            top_k=limit,
            mode=mode.value,
            filter_genre=genre,
            filter_service=service,
            filter_year_bucket=year_bucket,
            filter_runtime_bucket=runtime_bucket
        )
        
        print(f"✓ Generated {len(recs)} personalized recommendations (mode: {mode})")
        
        return {
            "recommendations": recs,
            "count": len(recs),
            "user_id": current_user.id,
            "mode": mode.value
        }
    
    except Exception as e:
        print(f"❌ Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.post("/api/recommendations", response_model=RecommendationsResponse, deprecated=True)
async def get_recommendations_legacy(preferences: UserPreferences):
    """
    **DEPRECATED:** Legacy endpoint for recommendations
    
    ⚠️  Use `GET /api/recommendations` instead (requires X-User-Id header)
    
    This endpoint is kept for backward compatibility but should not be used.
    It accepts user preferences directly in the request body, which bypasses
    the auth system and doesn't load preferences from the database.
    
    The modern GET endpoint:
    - Requires authentication (X-User-Id header)
    - Loads preferences from database
    - Loads user feedback from database
    - Provides fully personalized recommendations
    """
    try:
        recommender = get_recommender()
        
        # Validate user_id is provided (no default fallback)
        if not preferences.user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id is required. Use GET /api/recommendations with X-User-Id header instead."
            )
        
        # Convert Pydantic model to dataclass for ML module
        ml_prefs = MLUserPrefs(
            user_id=preferences.user_id,
            liked_movie_ids=preferences.liked_movie_ids,
            disliked_movie_ids=preferences.disliked_movie_ids,
            preferred_genres=preferences.preferred_genres,
            services=preferences.services,
            runtime_min=preferences.runtime_min,
            runtime_max=preferences.runtime_max
        )
        
        # Get recommendations
        recs = recommender.recommend(ml_prefs, top_k=20)
        
        # Convert to Pydantic models
        recommendations = [Recommendation(**rec) for rec in recs]
        
        return RecommendationsResponse(
            recommendations=recommendations,
            count=len(recommendations),
            user_id=preferences.user_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.get("/api/genres")
async def get_genres():
    """Get list of all available genres"""
    recommender = get_recommender()
    return {"genres": recommender.get_all_genres()}


@router.get("/api/services")
async def get_services():
    """Get list of all streaming services"""
    recommender = get_recommender()
    return {"services": recommender.get_all_services()}


@router.get("/api/movies/{movie_id}")
async def get_movie(movie_id: int):
    """Get movie details by ID"""
    recommender = get_recommender()
    movie = recommender.get_movie_by_id(movie_id)
    
    if movie is None:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")
    
    return movie

