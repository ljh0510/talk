from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload, joinedload
from app import models, schemas
import hashlib

from app.security import get_password_hash

# User CRUD
async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: schemas.UserCreate):
    hashed_pw = get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        hashed_password=hashed_pw,
        nickname=user_in.nickname,
        profile_image_url=user_in.profile_image_url,
        status_message=user_in.status_message,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_users_list(db: AsyncSession, exclude_user_id: int):
    result = await db.execute(
        select(models.User)
        .where(models.User.id != exclude_user_id)
        .order_by(models.User.nickname)
    )
    return result.scalars().all()

# Chat Room CRUD
async def create_chat_room(db: AsyncSession, room_in: schemas.ChatRoomCreate, creator_id: int):
    # Ensure creator is in the list of member_ids
    member_ids = list(set(room_in.member_ids + [creator_id]))
    
    # Create the room
    # For 1:1 room, if there are only 2 members, set name to null by default (dynamic name)
    # If custom name is provided, use it
    db_room = models.ChatRoom(
        name=room_in.name,
        is_group=room_in.is_group or len(member_ids) > 2
    )
    db.add(db_room)
    await db.flush()  # get db_room.id

    # Add members
    for member_id in member_ids:
        # Verify user exists
        user_result = await db.execute(select(models.User).where(models.User.id == member_id))
        user = user_result.scalars().first()
        if user:
            member_assoc = models.ChatRoomMember(
                room_id=db_room.id,
                user_id=member_id
            )
            db.add(member_assoc)
            
    await db.commit()
    
    # Retrieve complete room with loaded relationships
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
    # 1. Subquery to find the latest message ID for each room
    latest_msg_sub = (
        select(
            models.Message.room_id,
            func.max(models.Message.id).label("max_id")
        )
        .group_by(models.Message.room_id)
        .subquery()
    )

    # 2. Main query: fetch rooms, unread counts for user_id, and latest message IDs
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
        
    # Gather all latest message IDs
    latest_msg_ids = [row.latest_message_id for row in rows if row.latest_message_id is not None]
    
    # 3. Batch fetch the latest messages with their senders loaded
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
        
    # Sort rooms by latest message time, or room creation time if no message exists
    def get_sort_key(room_resp):
        if room_resp.latest_message:
            return room_resp.latest_message.created_at
        return room_resp.created_at
        
    response_rooms.sort(key=get_sort_key, reverse=True)
    return response_rooms

# Message CRUD
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
    
    # Reload message with sender info loaded
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


# Friendship CRUD
async def get_friends_list(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.Friendship)
        .options(joinedload(models.Friendship.friend))
        .where(models.Friendship.user_id == user_id)
    )
    return result.scalars().all()


async def add_friend(db: AsyncSession, user_id: int, friend_username: str):
    # 1. Find the friend by username
    friend_user = await get_user_by_username(db, friend_username)
    if not friend_user:
        return None, "존재하지 않는 사용자입니다."
    if friend_user.id == user_id:
        return None, "자기 자신은 친구로 추가할 수 없습니다."
        
    # 2. Check if friendship already exists
    stmt = select(models.Friendship).where(
        and_(
            models.Friendship.user_id == user_id,
            models.Friendship.friend_id == friend_user.id
        )
    )
    existing_result = await db.execute(stmt)
    existing = existing_result.scalars().first()
    if existing:
        if existing.status == "FRIEND":
            return None, "이미 친구로 추가된 사용자입니다."
        else:
            # If blocked or hidden, restore to FRIEND
            existing.status = "FRIEND"
            await db.commit()
            
            # Reload friendship with friend object loaded
            stmt_reload = select(models.Friendship).options(joinedload(models.Friendship.friend)).where(
                and_(models.Friendship.user_id == user_id, models.Friendship.friend_id == friend_user.id)
            )
            reload_res = await db.execute(stmt_reload)
            return reload_res.scalars().first(), None
            
    # 3. Create new friendship
    db_friendship = models.Friendship(
        user_id=user_id,
        friend_id=friend_user.id,
        status="FRIEND"
    )
    db.add(db_friendship)
    await db.commit()
    
    # Reload with relationship loaded
    stmt_reload = select(models.Friendship).options(joinedload(models.Friendship.friend)).where(
        and_(models.Friendship.user_id == user_id, models.Friendship.friend_id == friend_user.id)
    )
    reload_res = await db.execute(stmt_reload)
    return reload_res.scalars().first(), None


async def update_friend_status(db: AsyncSession, user_id: int, friend_id: int, status: str):
    stmt = select(models.Friendship).where(
        and_(
            models.Friendship.user_id == user_id,
            models.Friendship.friend_id == friend_id
        )
    )
    result = await db.execute(stmt)
    friendship = result.scalars().first()
    if friendship:
        friendship.status = status
        await db.commit()
        
        # Reload with relationship
        stmt_reload = select(models.Friendship).options(joinedload(models.Friendship.friend)).where(
            and_(models.Friendship.user_id == user_id, models.Friendship.friend_id == friend_id)
        )
        reload_res = await db.execute(stmt_reload)
        return reload_res.scalars().first()
    return None


async def update_user_profile(db: AsyncSession, user_id: int, user_update: schemas.UserUpdate):
    stmt = select(models.User).where(models.User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        if user_update.nickname is not None:
            user.nickname = user_update.nickname
        if user_update.status_message is not None:
            user.status_message = user_update.status_message
        if user_update.profile_image_url is not None:
            user.profile_image_url = user_update.profile_image_url
        await db.commit()
        await db.refresh(user)
        return user
    return None
