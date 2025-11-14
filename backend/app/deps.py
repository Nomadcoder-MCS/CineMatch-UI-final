"""
Shared dependencies for FastAPI endpoints
"""

from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User


def get_current_user(
    x_user_id: int = Header(..., description="User ID from frontend"),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current user from X-User-Id header
    
    For this school project, we use a simple header-based auth.
    In production, you'd use JWT tokens or session cookies.
    """
    user = db.query(User).filter(User.id == x_user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail=f"User with ID {x_user_id} not found. Please identify yourself first."
        )
    
    return user

