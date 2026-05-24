from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    city = Column(String, nullable=True)

    # Demographics for filtering
    gender = Column(String, nullable=True)   # "man", "woman", "nonbinary"
    seeking = Column(String, nullable=True)  # "men", "women", "everyone"

    # Onboarding state
    onboarding_step = Column(String, default="start")
    is_complete = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Raw answers (the actual valuable data)
    answers = Column(JSON, default=dict)

    # AI-extracted personality profile (used as a summary card, not the match itself)
    personality = Column(JSON, default=dict)

    last_active_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    direction = Column(String)  # "in" or "out"
    body = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="messages")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user_a_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    user_b_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    score = Column(Integer)  # 0-100, internal use only (not shown to users)
    reasoning = Column(Text)  # AI-generated, shown to both users
    state = Column(String, default="pending")
    a_response = Column(String, nullable=True)
    b_response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_a = relationship("User", foreign_keys=[user_a_id])
    user_b = relationship("User", foreign_keys=[user_b_id])

    __table_args__ = (
        Index("ix_match_pair", "user_a_id", "user_b_id"),
    )


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True, index=True)
    referral = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
