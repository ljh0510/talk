from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    username: str
    nickname: str
    profile_image_url: Optional[str] = None
    status_message: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    content: str
    message_type: str = "TEXT"

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    room_id: int
    sender_id: int
    sender: UserResponse
    created_at: datetime

    class Config:
        from_attributes = True

# ChatRoom Member Schema
class ChatRoomMemberResponse(BaseModel):
    user_id: int
    user: UserResponse
    joined_at: datetime
    last_read_at: datetime

    class Config:
        from_attributes = True

# ChatRoom Schemas
class ChatRoomBase(BaseModel):
    name: Optional[str] = None
    is_group: bool = False

class ChatRoomCreate(ChatRoomBase):
    member_ids: List[int] = Field(..., min_items=1)

class ChatRoomResponse(ChatRoomBase):
    id: int
    created_at: datetime
    members: List[UserResponse]
    latest_message: Optional[MessageResponse] = None
    unread_count: int = 0

    class Config:
        from_attributes = True

class ChatRoomDetailResponse(ChatRoomBase):
    id: int
    created_at: datetime
    members: List[ChatRoomMemberResponse]
    messages: List[MessageResponse]

    class Config:
        from_attributes = True

# Token response for simple auth
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Friendship Schemas
class FriendshipCreate(BaseModel):
    friend_username: str


class FriendshipUpdate(BaseModel):
    status: str  # "FRIEND", "BLOCKED", "HIDDEN"


class FriendshipResponse(BaseModel):
    friend_id: int
    status: str
    friend: UserResponse

    class Config:
        from_attributes = True


# User Profile Update Schema
class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    status_message: Optional[str] = None
    profile_image_url: Optional[str] = None
