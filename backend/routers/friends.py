from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from models import User
from schemas import FriendResponse, FriendAdd
from routers.users import map_user_to_response
import crud

router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("", response_model=List[FriendResponse])
async def list_friends(
    workspace_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_ws_id = workspace_id or current_user.workspace_id
    if not target_ws_id:
        return []
        
    friends = await crud.get_friends_list(db, current_user.id, target_ws_id)
    
    response = []
    for f in friends:
        response.append({
            "friend_id": f.friend_id,
            "friend": map_user_to_response(f.friend)
        })
    return response


@router.post("", response_model=FriendResponse)
async def add_friend(
    friend_add: FriendAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if friend_add.friend_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a friend"
        )
        
    target_ws_id = current_user.workspace_id
    if not target_ws_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자가 현재 소속된 활성 워크스페이스가 존재하지 않습니다."
        )
        
    friend_record, err = await crud.add_friend(db, current_user.id, friend_add.friend_email, target_ws_id)
    if err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err
        )
        
    return {
        "friend_id": friend_record.friend_id,
        "friend": map_user_to_response(friend_record.friend)
    }
