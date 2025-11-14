from pydantic import BaseModel
from typing import Optional


class WatchlistItem(BaseModel):
    """Item in user's watchlist"""
    movie_id: int
    title: str
    year: int
    runtime: int
    overview: str
    genres: list[str]
    services: list[str]
    added_date: str
    watched: bool = False


class AddToWatchlistRequest(BaseModel):
    """Request to add movie to watchlist"""
    movie_id: int


class WatchlistResponse(BaseModel):
    """Response containing watchlist"""
    user_id: str
    items: list[WatchlistItem]
    count: int

