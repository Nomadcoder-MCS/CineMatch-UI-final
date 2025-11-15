"""
Watchlist persistence endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, WatchlistItem
from app.deps import get_current_user
from app.schemas.persistence import WatchlistAdd, WatchlistItemResponse, WatchlistResponse
from ml.recommender import get_recommender

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=WatchlistResponse)
def get_my_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's watchlist with enriched metadata (poster, overview, etc.)
    """
    items = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id
    ).order_by(WatchlistItem.created_at.desc()).all()
    
    # Enrich items with metadata from recommender
    recommender = get_recommender()
    enriched_items = []
    
    for item in items:
        # Get movie metadata from recommender
        movie_meta = recommender.get_movie_by_id(item.movie_id)
        
        # Build response with enriched metadata
        item_dict = {
            "id": item.id,
            "movie_id": item.movie_id,
            "title": item.title or (movie_meta.get("title") if movie_meta else None),
            "service": item.service,
            "watched": item.watched,
            "created_at": item.created_at,
            "poster_url": movie_meta.get("poster_url") if movie_meta else None,
            "overview": movie_meta.get("overview") if movie_meta else None,
            "year": movie_meta.get("year") if movie_meta else None,
            "runtime": movie_meta.get("runtime") if movie_meta else None,
            "genres": movie_meta.get("genres", []) if movie_meta else []
        }
        enriched_items.append(WatchlistItemResponse(**item_dict))
    
    return WatchlistResponse(
        items=enriched_items,
        count=len(enriched_items)
    )


@router.post("", response_model=WatchlistItemResponse)
def add_to_watchlist(
    item_data: WatchlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a movie to watchlist (idempotent - won't duplicate)
    Returns enriched metadata (poster, overview, etc.)
    """
    # Check if already in watchlist
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == item_data.movie_id
    ).first()
    
    if existing:
        # Already in watchlist, enrich and return it
        recommender = get_recommender()
        movie_meta = recommender.get_movie_by_id(existing.movie_id)
        item_dict = {
            "id": existing.id,
            "movie_id": existing.movie_id,
            "title": existing.title or (movie_meta.get("title") if movie_meta else None),
            "service": existing.service,
            "watched": existing.watched,
            "created_at": existing.created_at,
            "poster_url": movie_meta.get("poster_url") if movie_meta else None,
            "overview": movie_meta.get("overview") if movie_meta else None,
            "year": movie_meta.get("year") if movie_meta else None,
            "runtime": movie_meta.get("runtime") if movie_meta else None,
            "genres": movie_meta.get("genres", []) if movie_meta else []
        }
        return WatchlistItemResponse(**item_dict)
    
    # Create new watchlist item
    new_item = WatchlistItem(
        user_id=current_user.id,
        movie_id=item_data.movie_id,
        title=item_data.title,
        service=item_data.service
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # Enrich with metadata
    recommender = get_recommender()
    movie_meta = recommender.get_movie_by_id(new_item.movie_id)
    item_dict = {
        "id": new_item.id,
        "movie_id": new_item.movie_id,
        "title": new_item.title or (movie_meta.get("title") if movie_meta else None),
        "service": new_item.service,
        "watched": new_item.watched,
        "created_at": new_item.created_at,
        "poster_url": movie_meta.get("poster_url") if movie_meta else None,
        "overview": movie_meta.get("overview") if movie_meta else None,
        "year": movie_meta.get("year") if movie_meta else None,
        "runtime": movie_meta.get("runtime") if movie_meta else None,
        "genres": movie_meta.get("genres", []) if movie_meta else []
    }
    return WatchlistItemResponse(**item_dict)


@router.delete("/{movie_id}")
def remove_from_watchlist(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a movie from watchlist
    """
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == movie_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Removed from watchlist", "movie_id": movie_id}


@router.post("/{movie_id}/watched")
def mark_watched(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a watchlist item as watched
    Returns enriched metadata (poster, overview, etc.)
    """
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == movie_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")
    
    item.watched = True
    db.commit()
    db.refresh(item)
    
    # Enrich with metadata
    recommender = get_recommender()
    movie_meta = recommender.get_movie_by_id(item.movie_id)
    item_dict = {
        "id": item.id,
        "movie_id": item.movie_id,
        "title": item.title or (movie_meta.get("title") if movie_meta else None),
        "service": item.service,
        "watched": item.watched,
        "created_at": item.created_at,
        "poster_url": movie_meta.get("poster_url") if movie_meta else None,
        "overview": movie_meta.get("overview") if movie_meta else None,
        "year": movie_meta.get("year") if movie_meta else None,
        "runtime": movie_meta.get("runtime") if movie_meta else None,
        "genres": movie_meta.get("genres", []) if movie_meta else []
    }
    return WatchlistItemResponse(**item_dict)

