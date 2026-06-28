import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, ChatRoomMember, Message
from app.websocket import manager
from app.routers import auth, users, friends, chats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto-create tables (for rapid prototyping/SQLite)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Close database connection pool
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Configure CORS (allow local client connections)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(friends.router, prefix="/api")
app.include_router(chats.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to the Enterprise Messenger API. Visit /docs for documentation."}

# Real-time WebSocket Endpoint matching: ws://localhost:8000/ws/chat/{user_id}
@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int
):
    # Retrieve user information for validation
    async with SessionLocal() as db:
        user_res = await db.execute(select(User).filter(User.id == user_id))
        user = user_res.scalars().first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        display_name = user.nickname
        avatar_url = user.profile_image_url

    # Connect client
    await manager.connect(str(user_id), websocket)
    
    try:
        while True:
            # WebSocket messages are currently handled as read-only receivers in client,
            # but we can listen for typing or read indicators if sent by the client.
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
            except json.JSONDecodeError:
                continue
                
            event_type = event.get("type")
            room_id = event.get("room_id")
            
            if not event_type or not room_id:
                continue

            async with SessionLocal() as db:
                # Verify user membership
                member_check = await db.execute(
                    select(ChatRoomMember).filter(
                        ChatRoomMember.room_id == room_id,
                        ChatRoomMember.user_id == user_id
                    )
                )
                member = member_check.scalars().first()
                if not member:
                    continue
                
                # Fetch all member IDs in the room
                members_res = await db.execute(
                    select(ChatRoomMember.user_id).filter(
                        ChatRoomMember.room_id == room_id
                    )
                )
                room_member_ids = [str(uid) for uid in members_res.scalars().all()]

                if event_type == "typing":
                    typing_payload = {
                        "event": "typing",
                        "room_id": room_id,
                        "user_id": user_id,
                        "display_name": display_name,
                        "is_typing": event.get("is_typing", True)
                    }
                    other_member_ids = [m_id for m_id in room_member_ids if m_id != str(user_id)]
                    await manager.broadcast_to_members(other_member_ids, typing_payload)

    except WebSocketDisconnect:
        manager.disconnect(str(user_id), websocket)
    except Exception:
        manager.disconnect(str(user_id), websocket)
