"""
Watchlist persistence endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, WatchlistItem
from app.deps import get_current_user
from app.schemas.persistence import WatchlistAdd, WatchlistItemResponse, WatchlistResponse

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=WatchlistResponse)
def get_my_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's watchlist
    """
    items = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id
    ).order_by(WatchlistItem.created_at.desc()).all()
    
    return WatchlistResponse(
        items=[WatchlistItemResponse.from_orm(item) for item in items],
        count=len(items)
    )


@router.post("", response_model=WatchlistItemResponse)
def add_to_watchlist(
    item_data: WatchlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a movie to watchlist (idempotent - won't duplicate)
    """
    # Check if already in watchlist
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == item_data.movie_id
    ).first()
    
    if existing:
        # Already in watchlist, return it
        return WatchlistItemResponse.from_orm(existing)
    
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
    
    return WatchlistItemResponse.from_orm(new_item)


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
    
    return WatchlistItemResponse.from_orm(item)

