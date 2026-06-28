from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class Friendship(Base):
    __tablename__ = "friends"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    friend_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default="FRIEND")  # FRIEND, BLOCKED, HIDDEN
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend: Mapped["User"] = relationship("User", foreign_keys=[friend_id])


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(100), nullable=False)
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    profile_image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status_message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    friends: Mapped[list["Friendship"]] = relationship("Friendship", foreign_keys=[Friendship.user_id], back_populates="user", cascade="all, delete-orphan")
    room_memberships: Mapped[list["ChatRoomMember"]] = relationship("ChatRoomMember", back_populates="user", cascade="all, delete-orphan")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
