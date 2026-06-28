from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Index, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class ChatRoomMember(Base):
    __tablename__ = "chat_room_members"

    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_read_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    chat_room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="room_members")
    user: Mapped["User"] = relationship("User", back_populates="room_memberships")


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_group: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    room_members: Mapped[list["ChatRoomMember"]] = relationship("ChatRoomMember", back_populates="chat_room", cascade="all, delete-orphan")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="chat_room", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_type: Mapped[str] = mapped_column(String(20), default="TEXT")  # TEXT, IMAGE, FILE, EMOJI
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    chat_room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="messages")
    sender: Mapped["User"] = relationship("User", back_populates="messages")

    # Composite index for quick messages retrieval and ordering within a chat room
    __table_args__ = (
        Index("idx_messages_room_created", "room_id", "created_at"),
    )
