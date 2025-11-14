"""
Auth endpoints for user identification
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, UserPreferences
from app.schemas.persistence import UserIdentify, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/identify", response_model=UserResponse)
def identify_user(
    user_data: UserIdentify,
    db: Session = Depends(get_db)
):
    """
    Identify or create a user by email
    
    - If user exists with this email, return them
    - If not, create a new user and return it
    - Also creates default UserPreferences for new users
    """
    # Check if user exists
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if user:
        # Update name in case it changed
        if user.name != user_data.name:
            user.name = user_data.name
            db.commit()
            db.refresh(user)
        
        return user
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default preferences for new user
    preferences = UserPreferences(user_id=new_user.id)
    db.add(preferences)
    db.commit()
    
    print(f"✓ Created new user: {new_user.name} ({new_user.email})")
    
    return new_user

