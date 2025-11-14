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

router = APIRouter()


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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized movie recommendations for the current user
    
    Loads user preferences and feedback from database and generates
    recommendations using the ML recommender.
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
        
        # Load user feedback (likes and dislikes)
        liked_movie_ids = []
        disliked_movie_ids = []
        
        feedback_records = db.query(UserFeedback).filter(
            UserFeedback.user_id == current_user.id
        ).all()
        
        for feedback in feedback_records:
            if feedback.signal == "like":
                liked_movie_ids.append(feedback.movie_id)
            elif feedback.signal == "dislike":
                disliked_movie_ids.append(feedback.movie_id)
        
        print(f"\n{'='*60}")
        print(f"Building recommendations for user: {current_user.name} (ID: {current_user.id})")
        print(f"  Preferred genres: {preferred_genres}")
        print(f"  Services: {services}")
        print(f"  Runtime: {runtime_min}-{runtime_max} min")
        print(f"  Liked movies: {len(liked_movie_ids)}")
        print(f"  Disliked movies: {len(disliked_movie_ids)}")
        print(f"{'='*60}")
        
        # Build ML preferences object
        ml_prefs = MLUserPrefs(
            user_id=str(current_user.id),
            liked_movie_ids=liked_movie_ids,
            disliked_movie_ids=disliked_movie_ids,
            preferred_genres=preferred_genres,
            services=services,
            runtime_min=runtime_min,
            runtime_max=runtime_max
        )
        
        # Get recommendations from ML model
        recs = recommender.recommend(ml_prefs, top_k=limit)
        
        print(f"✓ Generated {len(recs)} personalized recommendations")
        
        return {
            "recommendations": recs,
            "count": len(recs),
            "user_id": current_user.id
        }
    
    except Exception as e:
        print(f"❌ Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.post("/api/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(preferences: UserPreferences):
    """
    Get personalized movie recommendations
    
    Accepts user preferences and returns ranked list of movie recommendations
    using content-based filtering with TF-IDF + genre features.
    """
    try:
        recommender = get_recommender()
        
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
            user_id=preferences.user_id or "default_user"
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

