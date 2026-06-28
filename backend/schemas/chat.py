from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from schemas.user import UserResponse

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

class ChatRoomListResponse(ChatRoomBase):
    id: int
    created_at: datetime
    members: List[UserResponse]
    latest_message: Optional[MessageResponse] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class ChatRoomDetailResponse(ChatRoomBase):
    id: int
    created_at: datetime
    members: List[ChatRoomMemberDetailResponse]
    messages: List[MessageResponse]

    model_config = ConfigDict(from_attributes=True)
