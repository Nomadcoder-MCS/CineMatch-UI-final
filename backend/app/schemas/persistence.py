"""
Pydantic schemas for persistence endpoints (auth, preferences, watchlist, feedback)
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ============================================================================
# Auth Schemas
# ============================================================================

class UserIdentify(BaseModel):
    """
    Request to identify/create a user
    
    - For "Get started" (sign up): name and email are provided
    - For "Sign in": only email is provided (name is optional)
    """
    email: EmailStr
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class UserResponse(BaseModel):
    """User information returned to frontend"""
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Preferences Schemas
# ============================================================================

class PreferencesUpdate(BaseModel):
    """Update user preferences"""
    preferred_genres: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    original_languages: list[str] = Field(default_factory=list)
    runtime_min: Optional[int] = None
    runtime_max: Optional[int] = None


class PreferencesResponse(BaseModel):
    """User preferences returned to frontend"""
    preferred_genres: list[str]
    services: list[str]
    original_languages: list[str]
    runtime_min: Optional[int]
    runtime_max: Optional[int]
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Watchlist Schemas
# ============================================================================

class WatchlistAdd(BaseModel):
    """Add movie to watchlist"""
    movie_id: int = Field(..., gt=0)
    title: Optional[str] = None
    service: Optional[str] = None


class WatchlistItemResponse(BaseModel):
    """Watchlist item returned to frontend"""
    id: int
    movie_id: int
    title: Optional[str]
    service: Optional[str]
    watched: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class WatchlistResponse(BaseModel):
    """List of watchlist items"""
    items: list[WatchlistItemResponse]
    count: int


# ============================================================================
# Feedback Schemas
# ============================================================================

class FeedbackCreate(BaseModel):
    """Record user feedback on a movie"""
    movie_id: int = Field(..., gt=0)
    signal: str = Field(..., pattern="^(like|dislike|not_interested)$")


class FeedbackResponse(BaseModel):
    """Feedback confirmation"""
    id: int
    movie_id: int
    signal: str
    created_at: datetime
    
    class Config:
        from_attributes = True

