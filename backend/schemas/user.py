from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

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


class FriendAdd(BaseModel):
    friend_username: str

class FriendResponse(BaseModel):
    friend_id: int
    status: str
    friend: UserResponse

    model_config = ConfigDict(from_attributes=True)

class FriendUpdate(BaseModel):
    status: str
