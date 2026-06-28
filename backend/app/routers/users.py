from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_in.nickname is not None:
        current_user.nickname = user_in.nickname
    if user_in.profile_image_url is not None:
        current_user.profile_image_url = user_in.profile_image_url
    if user_in.status_message is not None:
        current_user.status_message = user_in.status_message
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("", response_model=List[UserResponse])
async def list_all_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve all users excluding self
    result = await db.execute(
        select(User).filter(User.id != current_user.id).order_by(User.nickname)
    )
    users = result.scalars().all()
    return users
