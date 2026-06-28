from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from models import User
from services.websocket import manager
from schemas import (
    ChatRoomCreate, ChatRoomDetailResponse, ChatRoomListResponse,
    MessageResponse, MessageCreate
)
from routers.users import map_user_to_response
import crud

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("", response_model=ChatRoomListResponse)
async def create_room(
    room_in: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_ws_id = current_user.workspace_id
    if not target_ws_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사용자가 현재 소속된 활성 워크스페이스가 존재하지 않습니다."
        )

    all_member_ids = list(set(room_in.member_ids + [current_user.id]))
    
    # 1. Validation
    if not await crud.chat.verify_users_exist(db, all_member_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more specified users do not exist"
        )
        
    # 2. Delegate creation (which encapsulates existing direct 1:1 room check)
    room = await crud.chat.create_chat_room(db, room_in, current_user.id, target_ws_id)
    
    # 3. Broadcast to other members
    other_members = [uid for uid in all_member_ids if uid != current_user.id]
    await manager.broadcast_to_members(
        [str(uid) for uid in other_members],
        {"event": "room_created", "room_id": room.id, "data": {}}
    )

    # 4. Fetch latest message if direct 1:1 room exists and had history
    last_msg = None
    if not room.is_group:
        messages = await crud.chat.get_room_messages(db, room.id)
        if messages:
            last_msg = messages[-1]

    members_list = [map_user_to_response(m.user) for m in room.room_members]
    
    return {
        "id": room.id,
        "name": room.name,
        "is_group": room.is_group,
        "created_at": room.created_at,
        "members": members_list,
        "latest_message": last_msg,
        "unread_count": 0
    }


@router.get("", response_model=List[ChatRoomListResponse])
async def list_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_ws_id = current_user.workspace_id
    if not target_ws_id:
        return []

    detailed_rooms = await crud.chat.get_user_chat_rooms(db, current_user.id, target_ws_id)
    
    response = []
    for item in detailed_rooms:
        room = item["room"]
        members_list = [map_user_to_response(m.user) for m in room.room_members]
        
        response.append({
            "id": room.id,
            "name": room.name,
            "is_group": room.is_group,
            "created_at": room.created_at,
            "members": members_list,
            "latest_message": item["latest_message"],
            "unread_count": item["unread_count"]
        })
        
    return response


@router.get("/{room_id}", response_model=ChatRoomDetailResponse)
async def get_room_detail(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not await crud.chat.verify_room_membership(db, room_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this chat room"
        )
        
    room = await crud.chat.get_chat_room_detail(db, room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
        
    messages = await crud.chat.get_room_messages(db, room_id)
    
    members_detail = []
    for m in room.room_members:
        members_detail.append({
            "user_id": m.user_id,
            "user": map_user_to_response(m.user),
            "joined_at": m.joined_at,
            "last_read_at": m.last_read_at
        })
        
    return {
        "id": room.id,
        "name": room.name,
        "is_group": room.is_group,
        "created_at": room.created_at,
        "members": members_detail,
        "messages": messages
    }


@router.post("/{room_id}/messages", response_model=MessageResponse)
async def send_message(
    room_id: int,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not await crud.chat.verify_room_membership(db, room_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this chat room"
        )
        
    # Eagerly load sender inside creation helper
    new_msg = await crud.chat.create_message(
        db=db,
        room_id=room_id,
        sender_id=current_user.id,
        content=msg_in.content,
        message_type=msg_in.message_type
    )
    
    # Update last read for the sender
    await crud.chat.update_last_read(db, room_id, current_user.id)
    
    room_member_ids = await crud.chat.get_room_member_ids(db, room_id)
    
    ws_payload = {
        "event": "new_message",
        "room_id": room_id,
        "data": {
            "id": new_msg.id,
            "room_id": room_id,
            "sender_id": current_user.id,
            "sender": map_user_to_response(new_msg.sender),
            "content": new_msg.content,
            "message_type": new_msg.message_type,
            "created_at": new_msg.created_at.isoformat()
        }
    }
    await manager.broadcast_to_members([str(uid) for uid in room_member_ids], ws_payload)
    
    return {
        "id": new_msg.id,
        "room_id": room_id,
        "sender_id": current_user.id,
        "sender": map_user_to_response(new_msg.sender),
        "content": new_msg.content,
        "message_type": new_msg.message_type,
        "created_at": new_msg.created_at
    }


@router.post("/{room_id}/read", status_code=status.HTTP_200_OK)
async def mark_room_as_read(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    membership = await crud.chat.update_last_read(db, room_id, current_user.id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room membership not found"
        )
        
    room_member_ids = await crud.chat.get_room_member_ids(db, room_id)
    
    read_payload = {
        "event": "room_read",
        "room_id": room_id,
        "user_id": current_user.id
    }
    await manager.broadcast_to_members([str(uid) for uid in room_member_ids], read_payload)
    
    return {"status": "success", "message": "Marked room as read"}
