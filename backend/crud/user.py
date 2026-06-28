from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
import models
import schemas
from core.security import get_password_hash

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

async def get_friends_list(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.Friendship)
        .options(joinedload(models.Friendship.friend))
        .where(models.Friendship.user_id == user_id)
    )
    return result.scalars().all()

async def add_friend(db: AsyncSession, user_id: int, friend_username: str):
    friend_user = await get_user_by_username(db, friend_username)
    if not friend_user:
        return None, "존재하지 않는 사용자입니다."
    if friend_user.id == user_id:
        return None, "자기 자신은 친구로 추가할 수 없습니다."
        
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
            existing.status = "FRIEND"
            await db.commit()
            
            stmt_reload = select(models.Friendship).options(joinedload(models.Friendship.friend)).where(
                and_(models.Friendship.user_id == user_id, models.Friendship.friend_id == friend_user.id)
            )
            reload_res = await db.execute(stmt_reload)
            return reload_res.scalars().first(), None
            
    db_friendship = models.Friendship(
        user_id=user_id,
        friend_id=friend_user.id,
        status="FRIEND"
    )
    db.add(db_friendship)
    await db.commit()
    
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

async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalars().first()
