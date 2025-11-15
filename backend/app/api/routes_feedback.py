"""
User feedback endpoints (like/dislike/not_interested)
"""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, UserFeedback
from app.deps import get_current_user
from app.schemas.persistence import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse)
def record_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record user feedback on a movie (upsert)
    
    Feedback semantics:
    - "like": Positive preference - used to build user profile and find similar movies
    - "dislike": Negative signal - can down-weight but not hard exclude
    - "not_interested": Hard exclusion - movie will NEVER appear in recommendations again
    
    If feedback already exists for this user+movie, updates the signal and created_at.
    Otherwise, creates a new feedback record.
    
    Uses X-User-Id header (via get_current_user dependency) to identify the user.
    """
    # Check if feedback already exists for this user+movie
    existing = db.query(UserFeedback).filter(
        UserFeedback.user_id == current_user.id,
        UserFeedback.movie_id == feedback.movie_id
    ).first()
    
    if existing:
        # Update existing feedback (user changed their mind)
        existing.signal = feedback.signal
        existing.created_at = datetime.utcnow()  # Update timestamp
        db.commit()
        db.refresh(existing)
        return FeedbackResponse.from_orm(existing)
    
    # Create new feedback
    new_feedback = UserFeedback(
        user_id=current_user.id,
        movie_id=feedback.movie_id,
        signal=feedback.signal
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    return FeedbackResponse.from_orm(new_feedback)


@router.get("/my-likes", response_model=list[int])
def get_my_likes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of movie IDs the user has liked
    (Useful for passing to recommendation engine)
    """
    likes = db.query(UserFeedback.movie_id).filter(
        UserFeedback.user_id == current_user.id,
        UserFeedback.signal == "like"
    ).all()
    
    return [movie_id for (movie_id,) in likes]


@router.get("/my-dislikes", response_model=list[int])
def get_my_dislikes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of movie IDs the user has disliked
    (Useful for filtering recommendations)
    """
    dislikes = db.query(UserFeedback.movie_id).filter(
        UserFeedback.user_id == current_user.id,
        UserFeedback.signal.in_(["dislike", "not_interested"])
    ).all()
    
    return [movie_id for (movie_id,) in dislikes]

