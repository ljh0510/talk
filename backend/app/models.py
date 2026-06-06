from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ChatRoomMember(Base):
    __tablename__ = "chatroom_members"

    room_id = Column(Integer, ForeignKey("chatrooms.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    room = relationship("ChatRoom", back_populates="room_members")
    user = relationship("User", back_populates="joined_rooms")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nickname = Column(String, nullable=False)
    profile_image_url = Column(String, nullable=True)
    status_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    joined_rooms = relationship("ChatRoomMember", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="sender")
    friends = relationship(
        "Friendship",
        foreign_keys="[Friendship.user_id]",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Friendship(Base):
    __tablename__ = "friendships"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    friend_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String, default="FRIEND")  # "FRIEND", "BLOCKED", "HIDDEN"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend = relationship("User", foreign_keys=[friend_id])


class ChatRoom(Base):
    __tablename__ = "chatrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)  # Nullable: for 1:1 chats, dynamic naming is typical
    is_group = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    room_members = relationship("ChatRoomMember", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chatrooms.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="TEXT")  # "TEXT", "IMAGE", "FILE"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", back_populates="messages")
