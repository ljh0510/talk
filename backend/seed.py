import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import Base, engine, AsyncSessionLocal
import models
import crud
import schemas

async def seed_data():
    print("Initializing Database Schemas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database Schemas Initialized.")
    db = AsyncSessionLocal()
    
    try:
        # Create users
        print("Seeding Users...")
        u1 = schemas.UserCreate(
            username="hong",
            password="password",
            nickname="홍길동",
            profile_image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            status_message="오늘도 힘차게! 😊"
        )
        u2 = schemas.UserCreate(
            username="lee",
            password="password",
            nickname="이순신",
            profile_image_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
            status_message="필사즉생 필생즉사"
        )
        u3 = schemas.UserCreate(
            username="sejong",
            password="password",
            nickname="세종대왕",
            profile_image_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
            status_message="랏트말싸미 듕귁에 달아..."
        )
        u4 = schemas.UserCreate(
            username="kim",
            password="password",
            nickname="김유신",
            profile_image_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
            status_message="말과 함께 달린다 🐴"
        )
        
        db_u1 = await crud.create_user(db, u1)
        db_u2 = await crud.create_user(db, u2)
        db_u3 = await crud.create_user(db, u3)
        db_u4 = await crud.create_user(db, u4)
        
        print(f"Users created: {db_u1.nickname}, {db_u2.nickname}, {db_u3.nickname}, {db_u4.nickname}")
        
        # Create a 1:1 chat between Hong and Lee
        print("Creating 1:1 Chat Room...")
        r1_in = schemas.ChatRoomCreate(
            name="이순신 장군님",
            is_group=False,
            member_ids=[db_u2.id] # creator db_u1 will be auto added
        )
        r1 = await crud.create_chat_room(db, r1_in, db_u1.id)
        
        # Add messages for r1
        print("Adding messages to 1:1 Chat...")
        # Msg 1: Lee -> Hong (older)
        m1 = models.Message(
            room_id=r1.id,
            sender_id=db_u2.id,
            content="길동아, 요즘 메신저 프로젝트는 잘 되어가는가?",
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        # Msg 2: Hong -> Lee
        m2 = models.Message(
            room_id=r1.id,
            sender_id=db_u1.id,
            content="네 장군님! 열심히 개발하고 있습니다. 곧 프로토타입이 나옵니다!",
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=45)
        )
        # Msg 3: Lee -> Hong (unread for Hong)
        m3 = models.Message(
            room_id=r1.id,
            sender_id=db_u2.id,
            content="훌륭하군. 나중에 한 번 보여주게나.",
            created_at=datetime.utcnow() - timedelta(minutes=10)
        )
        db.add_all([m1, m2, m3])
        await db.flush()
        
        # We need to simulate that Hong's last_read_at is before msg 3
        # Let's find Hong's ChatRoomMember entry and set last_read_at to 20 mins ago
        from sqlalchemy import select, and_
        stmt1 = select(models.ChatRoomMember).where(
            and_(
                models.ChatRoomMember.room_id == r1.id,
                models.ChatRoomMember.user_id == db_u1.id
            )
        )
        hong_member = (await db.execute(stmt1)).scalars().first()
        if hong_member:
            hong_member.last_read_at = datetime.utcnow() - timedelta(minutes=20)
            
        # Create a Group Chat (Hong, Sejong, Kim)
        print("Creating Group Chat Room...")
        r2_in = schemas.ChatRoomCreate(
            name="조선 오피니언 리더 모임",
            is_group=True,
            member_ids=[db_u3.id, db_u4.id] # creator db_u1 will be auto added
        )
        r2 = await crud.create_chat_room(db, r2_in, db_u1.id)
        
        # Add messages for r2
        print("Adding messages to Group Chat...")
        gm1 = models.Message(
            room_id=r2.id,
            sender_id=db_u3.id,
            content="새로운 문자 체계를 널리 배포해야 하느니라.",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        gm2 = models.Message(
            room_id=r2.id,
            sender_id=db_u4.id,
            content="대왕 전하, 한글 창제는 정말 혁명적이옵니다.",
            created_at=datetime.utcnow() - timedelta(hours=5)
        )
        gm3 = models.Message(
            room_id=r2.id,
            sender_id=db_u1.id,
            content="저도 동감합니다! 메신저에도 한글을 아주 잘 활용하고 있습니다.",
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        gm4 = models.Message(
            room_id=r2.id,
            sender_id=db_u3.id,
            content="조선 메신저 최고로다! 다들 주말 잘 보내거라.",
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add_all([gm1, gm2, gm3, gm4])
        await db.flush()
        
        # Keep Hong updated with r2, so 0 unreads
        stmt2 = select(models.ChatRoomMember).where(
            and_(
                models.ChatRoomMember.room_id == r2.id,
                models.ChatRoomMember.user_id == db_u1.id
            )
        )
        hong_member_r2 = (await db.execute(stmt2)).scalars().first()
        if hong_member_r2:
            hong_member_r2.last_read_at = datetime.utcnow()
            
        # Seed Friendships
        print("Seeding Friendships...")
        f1 = models.Friendship(user_id=db_u1.id, friend_id=db_u2.id, status="FRIEND")
        f2 = models.Friendship(user_id=db_u1.id, friend_id=db_u3.id, status="FRIEND")
        f3 = models.Friendship(user_id=db_u1.id, friend_id=db_u4.id, status="FRIEND")
        
        f4 = models.Friendship(user_id=db_u2.id, friend_id=db_u1.id, status="FRIEND")
        f5 = models.Friendship(user_id=db_u2.id, friend_id=db_u3.id, status="FRIEND")
        
        db.add_all([f1, f2, f3, f4, f5])
            
        await db.commit()
        print("Database seeding completed successfully!")
        
    except Exception as e:
        await db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
