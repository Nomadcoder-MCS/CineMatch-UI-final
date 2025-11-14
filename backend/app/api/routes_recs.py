"""
Recommendations API routes
"""

from fastapi import APIRouter, HTTPException
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

