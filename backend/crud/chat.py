from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload, joinedload
import models
import schemas

async def create_chat_room(db: AsyncSession, room_in: schemas.ChatRoomCreate, creator_id: int):
    member_ids = list(set(room_in.member_ids + [creator_id]))
    db_room = models.ChatRoom(
        name=room_in.name,
        is_group=room_in.is_group or len(member_ids) > 2
    )
    db.add(db_room)
    await db.flush()  # get db_room.id

    for member_id in member_ids:
        user_result = await db.execute(select(models.User).where(models.User.id == member_id))
        user = user_result.scalars().first()
        if user:
            member_assoc = models.ChatRoomMember(
                room_id=db_room.id,
                user_id=member_id
            )
            db.add(member_assoc)
            
    await db.commit()
    room_detail = await get_chat_room_detail(db, db_room.id)
    return room_detail

async def get_chat_room_detail(db: AsyncSession, room_id: int):
    result = await db.execute(
        select(models.ChatRoom)
        .options(
            selectinload(models.ChatRoom.room_members).selectinload(models.ChatRoomMember.user),
            selectinload(models.ChatRoom.messages).selectinload(models.Message.sender)
        )
        .where(models.ChatRoom.id == room_id)
    )
    return result.scalars().first()

async def get_user_chat_rooms(db: AsyncSession, user_id: int):
    latest_msg_sub = (
        select(
            models.Message.room_id,
            func.max(models.Message.id).label("max_id")
        )
        .group_by(models.Message.room_id)
        .subquery()
    )

    stmt = (
        select(
            models.ChatRoom,
            func.coalesce(func.count(models.Message.id), 0).label("unread_count"),
            latest_msg_sub.c.max_id.label("latest_message_id")
        )
        .join(
            models.ChatRoomMember,
            and_(
                models.ChatRoomMember.room_id == models.ChatRoom.id,
                models.ChatRoomMember.user_id == user_id
            )
        )
        .outerjoin(
            models.Message,
            and_(
                models.Message.room_id == models.ChatRoom.id,
                models.Message.created_at > models.ChatRoomMember.last_read_at
            )
        )
        .outerjoin(
            latest_msg_sub,
            latest_msg_sub.c.room_id == models.ChatRoom.id
        )
        .group_by(models.ChatRoom.id, latest_msg_sub.c.max_id)
        .options(
            selectinload(models.ChatRoom.room_members).selectinload(models.ChatRoomMember.user)
        )
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    if not rows:
        return []
        
    latest_msg_ids = [row.latest_message_id for row in rows if row.latest_message_id is not None]
    
    latest_messages = {}
    if latest_msg_ids:
        msg_stmt = (
            select(models.Message)
            .options(joinedload(models.Message.sender))
            .where(models.Message.id.in_(latest_msg_ids))
        )
        msg_result = await db.execute(msg_stmt)
        latest_messages = {msg.id: msg for msg in msg_result.scalars().all()}
        
    response_rooms = []
    for room, unread_count, latest_message_id in rows:
        members = [rm.user for rm in room.room_members]
        latest_msg = latest_messages.get(latest_message_id) if latest_message_id else None
        
        response_rooms.append(
            schemas.ChatRoomListResponse(
                id=room.id,
                name=room.name,
                is_group=room.is_group,
                created_at=room.created_at,
                members=[schemas.UserResponse.model_validate(m) for m in members],
                latest_message=schemas.MessageResponse.model_validate(latest_msg) if latest_msg else None,
                unread_count=unread_count
            )
        )
        
    def get_sort_key(room_resp):
        if room_resp.latest_message:
            return room_resp.latest_message.created_at
        return room_resp.created_at
        
    response_rooms.sort(key=get_sort_key, reverse=True)
    return response_rooms

async def create_message(db: AsyncSession, room_id: int, sender_id: int, content: str, message_type: str = "TEXT"):
    db_msg = models.Message(
        room_id=room_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type
    )
    db.add(db_msg)
    await db.commit()
    await db.refresh(db_msg)
    
    stmt = (
        select(models.Message)
        .options(joinedload(models.Message.sender))
        .where(models.Message.id == db_msg.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def update_last_read(db: AsyncSession, room_id: int, user_id: int):
    stmt = (
        select(models.ChatRoomMember)
        .where(
            and_(
                models.ChatRoomMember.room_id == room_id,
                models.ChatRoomMember.user_id == user_id
            )
        )
    )
    result = await db.execute(stmt)
    member = result.scalars().first()
    if member:
        from datetime import datetime
        member.last_read_at = datetime.utcnow()
        await db.commit()
        return True
    return False

async def verify_room_membership(db: AsyncSession, room_id: int, user_id: int) -> bool:
    result = await db.execute(
        select(models.ChatRoomMember).where(
            models.ChatRoomMember.room_id == room_id,
            models.ChatRoomMember.user_id == user_id
        )
    )
    return result.scalars().first() is not None

async def get_room_member_ids(db: AsyncSession, room_id: int) -> list[int]:
    result = await db.execute(
        select(models.ChatRoomMember.user_id).where(
            models.ChatRoomMember.room_id == room_id
        )
    )
    return list(result.scalars().all())
