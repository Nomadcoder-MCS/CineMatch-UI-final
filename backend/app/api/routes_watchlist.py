"""
Watchlist API routes

TODO: Replace in-memory storage with real database (PostgreSQL, MongoDB, etc.)
"""

from fastapi import APIRouter, HTTPException
from app.schemas.watchlist import WatchlistItem, AddToWatchlistRequest, WatchlistResponse
from ml.recommender import get_recommender
from datetime import datetime
from typing import Dict

router = APIRouter()

# In-memory watchlist storage (replace with DB in production)
# Structure: {user_id: {movie_id: WatchlistItem}}
_watchlists: Dict[str, Dict[int, WatchlistItem]] = {}


@router.get("/api/watchlist/{user_id}", response_model=WatchlistResponse)
async def get_watchlist(user_id: str):
    """
    Get user's watchlist
    
    Returns all movies the user has saved to watch later.
    """
    if user_id not in _watchlists:
        # Return empty watchlist
        return WatchlistResponse(
            user_id=user_id,
            items=[],
            count=0
        )
    
    items = list(_watchlists[user_id].values())
    
    return WatchlistResponse(
        user_id=user_id,
        items=items,
        count=len(items)
    )


@router.post("/api/watchlist/{user_id}")
async def add_to_watchlist(user_id: str, request: AddToWatchlistRequest):
    """
    Add movie to user's watchlist
    
    Fetches movie metadata and adds to user's watchlist.
    """
    recommender = get_recommender()
    
    # Get movie metadata
    movie = recommender.get_movie_by_id(request.movie_id)
    
    if movie is None:
        raise HTTPException(status_code=404, detail=f"Movie {request.movie_id} not found")
    
    # Initialize user's watchlist if needed
    if user_id not in _watchlists:
        _watchlists[user_id] = {}
    
    # Check if already in watchlist
    if request.movie_id in _watchlists[user_id]:
        return {
            "message": "Movie already in watchlist",
            "movie_id": request.movie_id
        }
    
    # Create watchlist item
    item = WatchlistItem(
        movie_id=movie['movie_id'],
        title=movie['title'],
        year=movie['year'],
        runtime=movie['runtime'],
        overview=movie['overview'],
        genres=movie['genres'],
        services=movie['services'],
        added_date=datetime.now().isoformat(),
        watched=False
    )
    
    # Add to watchlist
    _watchlists[user_id][request.movie_id] = item
    
    return {
        "message": "Added to watchlist",
        "movie_id": request.movie_id,
        "title": movie['title']
    }


@router.delete("/api/watchlist/{user_id}/{movie_id}")
async def remove_from_watchlist(user_id: str, movie_id: int):
    """
    Remove movie from user's watchlist
    """
    if user_id not in _watchlists or movie_id not in _watchlists[user_id]:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")
    
    movie_title = _watchlists[user_id][movie_id].title
    del _watchlists[user_id][movie_id]
    
    return {
        "message": "Removed from watchlist",
        "movie_id": movie_id,
        "title": movie_title
    }


@router.put("/api/watchlist/{user_id}/{movie_id}/watched")
async def mark_watched(user_id: str, movie_id: int, watched: bool = True):
    """
    Mark movie as watched/unwatched in watchlist
    """
    if user_id not in _watchlists or movie_id not in _watchlists[user_id]:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")
    
    _watchlists[user_id][movie_id].watched = watched
    
    return {
        "message": f"Marked as {'watched' if watched else 'unwatched'}",
        "movie_id": movie_id,
        "watched": watched
    }

