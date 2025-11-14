from pydantic import BaseModel, Field
from typing import Optional


class UserPreferences(BaseModel):
    """User preferences for generating recommendations"""
    user_id: Optional[str] = "default_user"
    liked_movie_ids: list[int] = Field(default_factory=list)
    disliked_movie_ids: list[int] = Field(default_factory=list)
    preferred_genres: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    runtime_min: Optional[int] = None
    runtime_max: Optional[int] = None


class Recommendation(BaseModel):
    """Single movie recommendation"""
    movie_id: int
    title: str
    year: int
    runtime: int
    overview: str
    genres: list[str]
    services: list[str]
    score: float
    explanation: str


class RecommendationsResponse(BaseModel):
    """Response containing list of recommendations"""
    recommendations: list[Recommendation]
    count: int
    user_id: str

