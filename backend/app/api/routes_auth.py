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
    
    Behavior:
    - If user exists with this email:
      - If name is provided and different from stored name, update it
      - Return the existing user (200 OK)
    
    - If user does NOT exist:
      - If name is provided: Create new user with name + email (200 OK)
      - If name is NOT provided: Return 404 with clear error message
    
    This allows:
    - "Get started" flow: POST with {name, email} → creates user or returns existing
    - "Sign in" flow: POST with {email} only → returns existing or 404 if not found
    """
    # Check if user exists
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if user:
        # User exists - update name if provided and different
        if user_data.name and user_data.name.strip() and user.name != user_data.name:
            user.name = user_data.name.strip()
            db.commit()
            db.refresh(user)
        
        return user
    
    # User does NOT exist
    # If no name provided, return 404 (user needs to sign up)
    if not user_data.name or not user_data.name.strip():
        raise HTTPException(
            status_code=404,
            detail="No account found for that email. Use 'Get started' to create one."
        )
    
    # Create new user (name is provided)
    new_user = User(
        name=user_data.name.strip(),
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

