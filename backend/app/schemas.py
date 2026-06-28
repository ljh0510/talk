from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None


# --- User Schemas ---
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    nickname: str = Field(..., min_length=2, max_length=50)
    profile_image_url: Optional[str] = None
    status_message: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=2, max_length=50)
    profile_image_url: Optional[str] = None
    status_message: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Friend Schemas ---
class FriendAdd(BaseModel):
    friend_username: str

class FriendResponse(BaseModel):
    friend_id: int
    status: str
    friend: UserResponse

    model_config = ConfigDict(from_attributes=True)

class FriendUpdate(BaseModel):
    status: str


# --- Message Schemas ---
class MessageBase(BaseModel):
    message_type: str = "TEXT"  # TEXT, IMAGE, FILE, EMOJI
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    sender: UserResponse
    content: str
    message_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- ChatRoom Schemas ---
class ChatRoomBase(BaseModel):
    name: Optional[str] = None
    is_group: bool = False

class ChatRoomCreate(BaseModel):
    name: Optional[str] = None
    member_ids: List[int] = Field(..., min_items=1)
    is_group: Optional[bool] = False

class ChatRoomMemberDetailResponse(BaseModel):
    user_id: int
    user: UserResponse
    joined_at: datetime
    last_read_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Schema for chat list item
class ChatRoomListResponse(ChatRoomBase):
    id: int
    created_at: datetime
    members: List[UserResponse]
    latest_message: Optional[MessageResponse] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# Schema for chat room detail view
class ChatRoomDetailResponse(ChatRoomBase):
    id: int
    created_at: datetime
    members: List[ChatRoomMemberDetailResponse]
    messages: List[MessageResponse]

    model_config = ConfigDict(from_attributes=True)
