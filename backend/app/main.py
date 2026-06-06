import os
from typing import List, Dict
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base, engine, get_db
from app import models, schemas, crud

app = FastAPI(title="KakaoTalk Clone Enterprise Backend")

# CORS Middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Specific origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Startup event: Initialize database schemas
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Simple Authentication Helper: Extraction of User via Bearer Token (token is user_id)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> models.User:
    token = credentials.credentials
    try:
        user_id = int(token)
    except ValueError:
        # If token is not integer, try as username
        user = await crud.get_user_by_username(db, token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization token",
            )
        return user

    # Get by user_id
    from sqlalchemy import select
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


# WebSocket Connection Manager for Realtime Message Dispatching
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Broken pipe or connection closed
                    pass

    async def broadcast_to_room_members(self, member_ids: List[int], message: dict):
        for user_id in member_ids:
            await self.send_to_user(user_id, message)

manager = ConnectionManager()


# Authentication Router
@app.post("/api/auth/register", response_model=schemas.UserResponse)
async def register(user_in: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await crud.get_user_by_username(db, user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return await crud.create_user(db, user_in)

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
async def login(credentials: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    db_user = await crud.get_user_by_username(db, credentials.username)
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    hashed_pw = crud.get_password_hash(credentials.password)
    if db_user.hashed_password != hashed_pw:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # Simple token is just user's ID string
    return schemas.TokenResponse(
        access_token=str(db_user.id),
        user=schemas.UserResponse.model_validate(db_user)
    )


# User Router
@app.get("/api/users", response_model=List[schemas.UserResponse])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return await crud.get_users_list(db, current_user.id)

@app.put("/api/users/me", response_model=schemas.UserResponse)
async def update_my_profile(
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = await crud.update_user_profile(db, current_user.id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Friendship Router
@app.get("/api/friends", response_model=List[schemas.FriendshipResponse])
async def get_friends(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return await crud.get_friends_list(db, current_user.id)

@app.post("/api/friends", response_model=schemas.FriendshipResponse)
async def add_new_friend(
    friend_in: schemas.FriendshipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    friendship, error_msg = await crud.add_friend(db, current_user.id, friend_in.friend_username)
    if error_msg:
        raise HTTPException(status_code=400, detail=error_msg)
    return friendship

@app.put("/api/friends/{friend_id}", response_model=schemas.FriendshipResponse)
async def update_friendship(
    friend_id: int,
    friend_update: schemas.FriendshipUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    friendship = await crud.update_friend_status(
        db, current_user.id, friend_id, friend_update.status
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship relationship not found")
    return friendship


# ChatRoom Router
@app.get("/api/rooms", response_model=List[schemas.ChatRoomResponse])
async def get_chat_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return await crud.get_user_chat_rooms(db, current_user.id)

@app.post("/api/rooms", response_model=schemas.ChatRoomDetailResponse)
async def create_chat_room(
    room_in: schemas.ChatRoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    room = await crud.create_chat_room(db, room_in, current_user.id)
    
    # Broadcast to all members that a new room is created
    member_ids = [m.user_id for m in room.room_members]
    event = {
        "event": "room_created",
        "data": {
            "id": room.id,
            "name": room.name,
            "is_group": room.is_group,
            "created_at": room.created_at.isoformat()
        }
    }
    await manager.broadcast_to_room_members(member_ids, event)
    
    members_detail = [
        schemas.ChatRoomMemberResponse(
            user_id=m.user_id,
            user=schemas.UserResponse.model_validate(m.user),
            joined_at=m.joined_at,
            last_read_at=m.last_read_at
        ) for m in room.room_members
    ]
    messages_detail = [
        schemas.MessageResponse.model_validate(msg) for msg in room.messages
    ]
    return schemas.ChatRoomDetailResponse(
        id=room.id,
        name=room.name,
        is_group=room.is_group,
        created_at=room.created_at,
        members=members_detail,
        messages=messages_detail
    )

@app.get("/api/rooms/{room_id}", response_model=schemas.ChatRoomDetailResponse)
async def get_chat_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    room = await crud.get_chat_room_detail(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Verify membership
    member_ids = [m.user_id for m in room.room_members]
    if current_user.id not in member_ids:
        raise HTTPException(status_code=403, detail="Not a member of this chat room")
        
    members_detail = [
        schemas.ChatRoomMemberResponse(
            user_id=m.user_id,
            user=schemas.UserResponse.model_validate(m.user),
            joined_at=m.joined_at,
            last_read_at=m.last_read_at
        ) for m in room.room_members
    ]
    messages_detail = [
        schemas.MessageResponse.model_validate(msg) for msg in room.messages
    ]
    return schemas.ChatRoomDetailResponse(
        id=room.id,
        name=room.name,
        is_group=room.is_group,
        created_at=room.created_at,
        members=members_detail,
        messages=messages_detail
    )

@app.post("/api/rooms/{room_id}/messages", response_model=schemas.MessageResponse)
async def send_message(
    room_id: int,
    message_in: schemas.MessageBase,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    room = await crud.get_chat_room_detail(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
        
    member_ids = [m.user_id for m in room.room_members]
    if current_user.id not in member_ids:
        raise HTTPException(status_code=403, detail="Not a member of this chat room")
        
    # Create the message
    msg = await crud.create_message(
        db, room_id, current_user.id, message_in.content, message_in.message_type
    )
    
    # Serialize message for JSON broadcasting
    msg_data = schemas.MessageResponse.model_validate(msg).model_dump()
    # Serialize datetime
    msg_data["created_at"] = msg_data["created_at"].isoformat()
    msg_data["sender"]["created_at"] = msg_data["sender"]["created_at"].isoformat()

    # Broadcast to all members
    event = {
        "event": "new_message",
        "room_id": room_id,
        "data": msg_data
    }
    await manager.broadcast_to_room_members(member_ids, event)
    
    return msg

@app.post("/api/rooms/{room_id}/read")
async def read_chat_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    updated = await crud.update_last_read(db, room_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Chat room member connection not found")
        
    # Broadcast read status update to other room members
    room = await crud.get_chat_room_detail(db, room_id)
    member_ids = [m.user_id for m in room.room_members]
    
    event = {
        "event": "room_read",
        "room_id": room_id,
        "user_id": current_user.id
    }
    await manager.broadcast_to_room_members(member_ids, event)
    return {"status": "success"}


# Realtime WebSockets Route
@app.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: int):
    # Establish connection
    await manager.connect(user_id, websocket)
    try:
        while True:
            # We don't expect high amount of incoming messages via WebSocket
            # as text submissions can go through standard HTTP POST APIs, 
            # but we can listen for heartbeat/status updates here.
            data = await websocket.receive_text()
            # Simple echo or heartbeat ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)
