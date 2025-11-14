"""
SQLAlchemy ORM models for CineMatch
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    watchlist = relationship("WatchlistItem", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("UserFeedback", back_populates="user", cascade="all, delete-orphan")


class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Pipe-separated strings for list fields
    preferred_genres = Column(String, default="")  # e.g., "action|sci-fi|thriller"
    services = Column(String, default="")  # e.g., "Netflix|Hulu"
    original_languages = Column(String, default="")  # e.g., "en|es|fr"
    
    # Runtime preferences
    runtime_min = Column(Integer, nullable=True)
    runtime_max = Column(Integer, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="preferences")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)  # References movie in ML catalog
    
    # Optional metadata (for display without hitting ML model)
    title = Column(String, nullable=True)
    service = Column(String, nullable=True)
    
    # Status
    watched = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="watchlist")
    
    # Unique constraint: one movie per user
    __table_args__ = (
        CheckConstraint("movie_id > 0"),
    )


class UserFeedback(Base):
    __tablename__ = "user_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    
    # Signal: "like", "dislike", or "not_interested"
    signal = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="feedback")
    
    # Constraint on signal values
    __table_args__ = (
        CheckConstraint("signal IN ('like', 'dislike', 'not_interested')"),
    )

