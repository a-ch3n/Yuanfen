from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    city = Column(String, nullable=True)

    # Onboarding state
    onboarding_step = Column(String, default="start")  # start, name, age, city, q1, q2, q3, q4, q5, complete
    is_complete = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Raw answers
    answers = Column(JSON, default=dict)

    # AI-extracted personality profile
    personality = Column(JSON, default=dict)
    # Example: {"openness": 0.8, "emotional_depth": 0.7, "humor": "dry", "values": [...], "summary": "..."}

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    direction = Column(String)  # "in" or "out"
    body = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="messages")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user_a_id = Column(Integer, ForeignKey("users.id"))
    user_b_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)  # 0-100
    reasoning = Column(Text)
    state = Column(String, default="pending")
    # pending -> sent_to_a -> a_yes / a_no -> sent_to_b -> b_yes / b_no -> connected / rejected
    a_response = Column(String, nullable=True)  # YES, NO, null
    b_response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_a = relationship("User", foreign_keys=[user_a_id])
    user_b = relationship("User", foreign_keys=[user_b_id])


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    referral = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
