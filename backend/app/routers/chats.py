from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, ChatRoom, ChatRoomMember, Message
from app.websocket import manager
from app.schemas import (
    ChatRoomCreate, ChatRoomDetailResponse, ChatRoomListResponse,
    MessageResponse, MessageCreate
)

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("", response_model=ChatRoomListResponse)
async def create_room(
    room_in: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Ensure members includes the creator
    all_member_ids = list(set(room_in.member_ids + [current_user.id]))
    
    # 1. Validation: check if other members exist
    member_check = await db.execute(select(User).filter(User.id.in_(all_member_ids)))
    db_users = member_check.scalars().all()
    if len(db_users) != len(all_member_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more specified users do not exist"
        )
        
    is_group = len(all_member_ids) > 2 or room_in.name is not None
    
    # 2. Check for existing DIRECT chat if not a group
    if not is_group and len(all_member_ids) == 2:
        u1, u2 = all_member_ids[0], all_member_ids[1]
        
        # Select room_id that has both users in memberships and is not a group
        subq = (
            select(ChatRoomMember.room_id)
            .join(ChatRoom, ChatRoom.id == ChatRoomMember.room_id)
            .filter(ChatRoom.is_group == False)
            .filter(ChatRoomMember.user_id.in_([u1, u2]))
            .group_by(ChatRoomMember.room_id)
            .having(func.count(ChatRoomMember.user_id) == 2)
        )
        existing_room_res = await db.execute(subq)
        existing_room_id = existing_room_res.scalar()
        
        if existing_room_id:
            # Load and return the existing room
            q = (
                select(ChatRoom)
                .filter(ChatRoom.id == existing_room_id)
                .options(selectinload(ChatRoom.room_members).selectinload(ChatRoomMember.user))
            )
            res = await db.execute(q)
            room = res.scalars().first()
            
            # Fetch last message
            msg_res = await db.execute(
                select(Message)
                .filter(Message.room_id == room.id)
                .order_by(Message.created_at.desc())
                .options(selectinload(Message.sender))
                .limit(1)
            )
            last_msg = msg_res.scalars().first()
            
            # Update last_read_at for this user
            for mem in room.room_members:
                if mem.user_id == current_user.id:
                    mem.last_read_at = datetime.utcnow()
                    db.add(mem)
            await db.commit()
            
            # Broadcast "room_created" to other members
            other_members = [uid for uid in all_member_ids if uid != current_user.id]
            await manager.broadcast_to_members(
                other_members,
                {"event": "room_created", "room_id": room.id, "data": {}}
            )

            members_list = [m.user for m in room.room_members]
            
            return ChatRoomListResponse(
                id=room.id,
                name=room.name,
                is_group=room.is_group,
                created_at=room.created_at,
                members=members_list,
                latest_message=last_msg,
                unread_count=0
            )

    # 3. Create new room
    new_room = ChatRoom(
        name=room_in.name,
        is_group=is_group
    )
    db.add(new_room)
    await db.flush()
    
    # 4. Add members
    for user_id in all_member_ids:
        member = ChatRoomMember(
            room_id=new_room.id,
            user_id=user_id,
            last_read_at=datetime.utcnow()
        )
        db.add(member)
        
    await db.commit()
    
    # Reload room with relationships
    q = (
        select(ChatRoom)
        .filter(ChatRoom.id == new_room.id)
        .options(selectinload(ChatRoom.room_members).selectinload(ChatRoomMember.user))
    )
    res = await db.execute(q)
    room = res.scalars().first()
    
    members_list = [m.user for m in room.room_members]
    
    # Broadcast "room_created" to other members
    other_members = [uid for uid in all_member_ids if uid != current_user.id]
    await manager.broadcast_to_members(
        other_members,
        {"event": "room_created", "room_id": room.id, "data": {}}
    )

    return ChatRoomListResponse(
        id=room.id,
        name=room.name,
        is_group=room.is_group,
        created_at=room.created_at,
        members=members_list,
        latest_message=None,
        unread_count=0
    )


@router.get("", response_model=List[ChatRoomListResponse])
async def list_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all chat rooms that current user belongs to
    query = (
        select(ChatRoom)
        .join(ChatRoomMember, ChatRoom.id == ChatRoomMember.room_id)
        .filter(ChatRoomMember.user_id == current_user.id)
        .options(selectinload(ChatRoom.room_members).selectinload(ChatRoomMember.user))
    )
    
    result = await db.execute(query)
    rooms = result.scalars().all()
    
    detailed_rooms = []
    
    for room in rooms:
        # 1. Fetch last message
        msg_query = (
            select(Message)
            .filter(Message.room_id == room.id)
            .order_by(Message.created_at.desc())
            .options(selectinload(Message.sender))
            .limit(1)
        )
        msg_result = await db.execute(msg_query)
        last_msg = msg_result.scalars().first()
        
        # 2. Get user's membership details to find last_read_at
        user_membership = next(m for m in room.room_members if m.user_id == current_user.id)
        last_read_at = user_membership.last_read_at
        
        # 3. Compute unread count
        unread_query = (
            select(func.count(Message.id))
            .filter(
                Message.room_id == room.id,
                Message.created_at > last_read_at,
                Message.sender_id != current_user.id
            )
        )
        unread_res = await db.execute(unread_query)
        unread_count = unread_res.scalar() or 0
        
        # Prepare members list response (flat list of Users)
        members_list = [m.user for m in room.room_members]
        
        detailed_rooms.append({
            "id": room.id,
            "name": room.name,
            "is_group": room.is_group,
            "created_at": room.created_at,
            "members": members_list,
            "latest_message": last_msg,
            "unread_count": unread_count
        })
        
    # Sort rooms by latest message created_at (descending) or room creation time if no messages
    def get_sort_key(room_dict):
        if room_dict["latest_message"]:
            return room_dict["latest_message"].created_at
        return room_dict["created_at"]
        
    detailed_rooms.sort(key=get_sort_key, reverse=True)
    
    return detailed_rooms


@router.get("/{room_id}", response_model=ChatRoomDetailResponse)
async def get_room_detail(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify membership
    membership_check = await db.execute(
        select(ChatRoomMember).filter(
            ChatRoomMember.room_id == room_id,
            ChatRoomMember.user_id == current_user.id
        )
    )
    membership = membership_check.scalars().first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this chat room"
        )
        
    # Load room
    q = (
        select(ChatRoom)
        .filter(ChatRoom.id == room_id)
        .options(selectinload(ChatRoom.room_members).selectinload(ChatRoomMember.user))
    )
    res = await db.execute(q)
    room = res.scalars().first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
        
    # Load messages
    msg_query = (
        select(Message)
        .filter(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
        .options(selectinload(Message.sender))
    )
    msg_res = await db.execute(msg_query)
    messages = msg_res.scalars().all()
    
    # Detail response format helper
    members_detail = []
    for m in room.room_members:
        members_detail.append({
            "user_id": m.user_id,
            "user": m.user,
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
    # Verify membership
    membership_check = await db.execute(
        select(ChatRoomMember).filter(
            ChatRoomMember.room_id == room_id,
            ChatRoomMember.user_id == current_user.id
        )
    )
    membership = membership_check.scalars().first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this chat room"
        )
        
    # Create message
    new_msg = Message(
        room_id=room_id,
        sender_id=current_user.id,
        content=msg_in.content,
        message_type=msg_in.message_type
    )
    db.add(new_msg)
    
    # Update last_read_at for sender
    membership.last_read_at = datetime.utcnow()
    db.add(membership)
    
    await db.flush()
    
    # Load relationships for response and broadcast
    sender_res = await db.execute(select(User).filter(User.id == current_user.id))
    sender = sender_res.scalars().first()
    
    await db.commit()
    
    # Broadcast message to WebSocket connections
    members_res = await db.execute(
        select(ChatRoomMember.user_id).filter(ChatRoomMember.room_id == room_id)
    )
    room_member_ids = members_res.scalars().all()
    
    # Construct websocket payload matching useChatStore.ts expectations
    ws_payload = {
        "event": "new_message",
        "room_id": room_id,
        "data": {
            "id": new_msg.id,
            "room_id": room_id,
            "sender_id": current_user.id,
            "sender": {
                "id": sender.id,
                "username": sender.username,
                "nickname": sender.nickname,
                "profile_image_url": sender.profile_image_url,
                "status_message": sender.status_message,
                "created_at": sender.created_at.isoformat()
            },
            "content": new_msg.content,
            "message_type": new_msg.message_type,
            "created_at": new_msg.created_at.isoformat()
        }
    }
    await manager.broadcast_to_members([str(uid) for uid in room_member_ids], ws_payload)
    
    # Return MessageResponse
    return {
        "id": new_msg.id,
        "room_id": room_id,
        "sender_id": current_user.id,
        "sender": sender,
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
    # Find membership
    result = await db.execute(
        select(ChatRoomMember).filter(
            ChatRoomMember.room_id == room_id,
            ChatRoomMember.user_id == current_user.id
        )
    )
    membership = result.scalars().first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room membership not found"
        )
        
    # Update last_read_at
    membership.last_read_at = datetime.utcnow()
    db.add(membership)
    await db.commit()
    
    # Broadcast read confirmation to other members
    members_res = await db.execute(
        select(ChatRoomMember.user_id).filter(ChatRoomMember.room_id == room_id)
    )
    room_member_ids = members_res.scalars().all()
    
    read_payload = {
        "event": "room_read",
        "room_id": room_id,
        "user_id": current_user.id
    }
    await manager.broadcast_to_members([str(uid) for uid in room_member_ids], read_payload)
    
    return {"status": "success", "message": "Marked room as read"}
