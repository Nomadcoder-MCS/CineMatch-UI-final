"""
User preferences endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, UserPreferences
from app.deps import get_current_user
from app.schemas.persistence import PreferencesUpdate, PreferencesResponse

router = APIRouter(prefix="/api/preferences", tags=["preferences"])


@router.get("/me", response_model=PreferencesResponse)
def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's preferences
    """
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Create default preferences if they don't exist
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    # Convert pipe-separated strings to lists
    return PreferencesResponse(
        preferred_genres=prefs.preferred_genres.split('|') if prefs.preferred_genres else [],
        services=prefs.services.split('|') if prefs.services else [],
        original_languages=prefs.original_languages.split('|') if prefs.original_languages else [],
        runtime_min=prefs.runtime_min,
        runtime_max=prefs.runtime_max,
        updated_at=prefs.updated_at
    )


@router.put("/me", response_model=PreferencesResponse)
def update_my_preferences(
    preferences: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's preferences (upsert)
    """
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Create new preferences
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
    
    # Update fields (convert lists to pipe-separated strings)
    prefs.preferred_genres = '|'.join(preferences.preferred_genres) if preferences.preferred_genres else ""
    prefs.services = '|'.join(preferences.services) if preferences.services else ""
    prefs.original_languages = '|'.join(preferences.original_languages) if preferences.original_languages else ""
    prefs.runtime_min = preferences.runtime_min
    prefs.runtime_max = preferences.runtime_max
    
    db.commit()
    db.refresh(prefs)
    
    # Convert back to lists for response
    return PreferencesResponse(
        preferred_genres=prefs.preferred_genres.split('|') if prefs.preferred_genres else [],
        services=prefs.services.split('|') if prefs.services else [],
        original_languages=prefs.original_languages.split('|') if prefs.original_languages else [],
        runtime_min=prefs.runtime_min,
        runtime_max=prefs.runtime_max,
        updated_at=prefs.updated_at
    )

