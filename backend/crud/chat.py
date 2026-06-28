from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload, joinedload
import models
import schemas

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
import models
import schemas

async def check_existing_direct_room(db: AsyncSession, u1: int, u2: int, workspace_id: int) -> int | None:
    subq = (
        select(models.ChatRoomMember.room_id)
        .join(models.ChatRoom, models.ChatRoom.id == models.ChatRoomMember.room_id)
        .filter(models.ChatRoom.is_group == False)
        .filter(models.ChatRoom.workspace_id == workspace_id)
        .filter(models.ChatRoomMember.user_id.in_([u1, u2]))
        .group_by(models.ChatRoomMember.room_id)
        .having(func.count(models.ChatRoomMember.user_id) == 2)
    )
    result = await db.execute(subq)
    return result.scalar()

async def verify_users_exist(db: AsyncSession, user_ids: list[int]) -> bool:
    member_check = await db.execute(select(models.User).filter(models.User.id.in_(user_ids)))
    db_users = member_check.scalars().all()
    return len(db_users) == len(user_ids)

async def create_chat_room(db: AsyncSession, room_in: schemas.ChatRoomCreate, creator_id: int, workspace_id: int):
    all_member_ids = list(set(room_in.member_ids + [creator_id]))
    
    is_group = len(all_member_ids) > 2 or room_in.name is not None
    
    # Check for existing direct 1:1 room
    if not is_group and len(all_member_ids) == 2:
        u1, u2 = all_member_ids[0], all_member_ids[1]
        existing_room_id = await check_existing_direct_room(db, u1, u2, workspace_id)
        if existing_room_id:
            room = await get_chat_room_detail(db, existing_room_id)
            for mem in room.room_members:
                if mem.user_id == creator_id:
                    mem.last_read_at = datetime.now(timezone.utc)
                    db.add(mem)
            await db.commit()
            return room
            
    # Create new
    new_room = models.ChatRoom(
        workspace_id=workspace_id,
        name=room_in.name,
        is_group=is_group
    )
    db.add(new_room)
    await db.flush()
    
    for user_id in all_member_ids:
        member = models.ChatRoomMember(
            room_id=new_room.id,
            user_id=user_id,
            workspace_id=workspace_id,
            last_read_at=datetime.now(timezone.utc)
        )
        db.add(member)
        
    await db.commit()
    return await get_chat_room_detail(db, new_room.id)

async def get_chat_room_detail(db: AsyncSession, room_id: int):
    result = await db.execute(
        select(models.ChatRoom)
        .options(
            selectinload(models.ChatRoom.room_members)
            .selectinload(models.ChatRoomMember.user)
            .options(
                selectinload(models.User.workspace_memberships).selectinload(models.WorkspaceMember.workspace),
                selectinload(models.User.department_memberships).options(
                    selectinload(models.DepartmentMember.department).selectinload(models.Department.manager),
                    selectinload(models.DepartmentMember.position),
                    selectinload(models.DepartmentMember.duty)
                )
            )
        )
        .where(models.ChatRoom.id == room_id)
    )
    return result.scalars().first()

async def get_room_messages(db: AsyncSession, room_id: int):
    msg_query = (
        select(models.Message)
        .filter(models.Message.room_id == room_id)
        .order_by(models.Message.created_at.asc())
        .options(
            selectinload(models.Message.sender).options(
                selectinload(models.User.workspace_memberships).selectinload(models.WorkspaceMember.workspace),
                selectinload(models.User.department_memberships).options(
                    selectinload(models.DepartmentMember.department).selectinload(models.Department.manager),
                    selectinload(models.DepartmentMember.position),
                    selectinload(models.DepartmentMember.duty)
                )
            )
        )
    )
    msg_res = await db.execute(msg_query)
    return msg_res.scalars().all()

async def get_user_chat_rooms(db: AsyncSession, user_id: int, workspace_id: int):
    query = (
        select(models.ChatRoom)
        .join(models.ChatRoomMember, models.ChatRoom.id == models.ChatRoomMember.room_id)
        .filter(
            and_(
                models.ChatRoomMember.user_id == user_id,
                models.ChatRoom.workspace_id == workspace_id
            )
        )
        .options(
            selectinload(models.ChatRoom.room_members)
            .selectinload(models.ChatRoomMember.user)
            .options(
                selectinload(models.User.workspace_memberships).selectinload(models.WorkspaceMember.workspace),
                selectinload(models.User.department_memberships).options(
                    selectinload(models.DepartmentMember.department).selectinload(models.Department.manager),
                    selectinload(models.DepartmentMember.position),
                    selectinload(models.DepartmentMember.duty)
                )
            )
        )
    )
    
    result = await db.execute(query)
    rooms = result.scalars().all()
    
    detailed_rooms = []
    for room in rooms:
        msg_query = (
            select(models.Message)
            .filter(models.Message.room_id == room.id)
            .order_by(models.Message.created_at.desc())
            .options(
                selectinload(models.Message.sender).options(
                    selectinload(models.User.workspace_memberships).selectinload(models.WorkspaceMember.workspace),
                    selectinload(models.User.department_memberships).options(
                        selectinload(models.DepartmentMember.department).selectinload(models.Department.manager),
                        selectinload(models.DepartmentMember.position),
                        selectinload(models.DepartmentMember.duty)
                    )
                )
            )
            .limit(1)
        )
        msg_result = await db.execute(msg_query)
        last_msg = msg_result.scalars().first()
        
        user_membership = next(m for m in room.room_members if m.user_id == user_id)
        last_read_at = user_membership.last_read_at
        
        unread_query = (
            select(func.count(models.Message.id))
            .filter(
                models.Message.room_id == room.id,
                models.Message.created_at > last_read_at,
                models.Message.sender_id != user_id
            )
        )
        unread_res = await db.execute(unread_query)
        unread_count = unread_res.scalar() or 0
        
        detailed_rooms.append({
            "room": room,
            "latest_message": last_msg,
            "unread_count": unread_count
        })
        
    def get_sort_key(room_dict):
        if room_dict["latest_message"]:
            return room_dict["latest_message"].created_at
        return room_dict["room"].created_at
        
    detailed_rooms.sort(key=get_sort_key, reverse=True)
    return detailed_rooms

async def create_message(db: AsyncSession, room_id: int, sender_id: int, content: str, message_type: str = "TEXT"):
    db_msg = models.Message(
        room_id=room_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type
    )
    db.add(db_msg)
    await db.flush()
    
    stmt = (
        select(models.Message)
        .options(
            selectinload(models.Message.sender).options(
                selectinload(models.User.workspace_memberships).selectinload(models.WorkspaceMember.workspace),
                selectinload(models.User.department_memberships).options(
                    selectinload(models.DepartmentMember.department).selectinload(models.Department.manager),
                    selectinload(models.DepartmentMember.position),
                    selectinload(models.DepartmentMember.duty)
                )
            )
        )
        .where(models.Message.id == db_msg.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def update_last_read(db: AsyncSession, room_id: int, user_id: int) -> models.ChatRoomMember | None:
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
        member.last_read_at = datetime.now(timezone.utc)
        db.add(member)
        await db.commit()
        return member
    return None

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
