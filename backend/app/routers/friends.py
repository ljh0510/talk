from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Friendship
from app.schemas import FriendResponse, FriendAdd, FriendUpdate

router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("", response_model=List[FriendResponse])
async def list_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch friendships with friend details eager-loaded
    result = await db.execute(
        select(Friendship)
        .filter(Friendship.user_id == current_user.id)
        .options(selectinload(Friendship.friend))
    )
    friends = result.scalars().all()
    
    # Map to schema FriendResponse
    response = []
    for f in friends:
        response.append({
            "friend_id": f.friend_id,
            "status": f.status,
            "friend": f.friend
        })
    return response


@router.post("", response_model=FriendResponse)
async def add_friend(
    friend_add: FriendAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if friend_add.friend_username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a friend"
        )
        
    # Find user by username
    result = await db.execute(select(User).filter(User.username == friend_add.friend_username))
    friend_user = result.scalars().first()
    if not friend_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Check if already friends
    check_result = await db.execute(
        select(Friendship).filter(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == friend_user.id
        )
    )
    existing_friend = check_result.scalars().first()
    if existing_friend:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already friends with this user"
        )
        
    # Create friendship record
    new_friend = Friendship(
        user_id=current_user.id,
        friend_id=friend_user.id,
        status="FRIEND"
    )
    db.add(new_friend)
    await db.flush()
    
    # Reload with relationship
    query = select(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.friend_id == friend_user.id
    ).options(selectinload(Friendship.friend))
    
    res = await db.execute(query)
    friend_record = res.scalars().first()
    
    await db.commit()
    
    return {
        "friend_id": friend_record.friend_id,
        "status": friend_record.status,
        "friend": friend_record.friend
    }


@router.put("/{friend_id}", response_model=FriendResponse)
async def update_friend(
    friend_id: int,
    friend_update: FriendUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find friendship
    result = await db.execute(
        select(Friendship)
        .filter(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id)
        .options(selectinload(Friendship.friend))
    )
    friendship = result.scalars().first()
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found"
        )
        
    # Update status
    friendship.status = friend_update.status
    db.add(friendship)
    await db.commit()
    await db.refresh(friendship)
    
    return {
        "friend_id": friendship.friend_id,
        "status": friendship.status,
        "friend": friendship.friend
    }
