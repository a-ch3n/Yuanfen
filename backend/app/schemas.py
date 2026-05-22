from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, Any
from datetime import datetime


class WaitlistIn(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    referral: Optional[str] = None

    @model_validator(mode="after")
    def at_least_one_contact(self):
        if not self.email and not self.phone:
            raise ValueError("Provide an email or phone number.")
        return self


class WaitlistOut(BaseModel):
    id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    phone: str
    name: Optional[str]
    age: Optional[int]
    city: Optional[str]
    onboarding_step: str
    is_complete: bool
    personality: Optional[dict[str, Any]] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class MatchOut(BaseModel):
    id: int
    user_a_id: int
    user_b_id: int
    score: int
    reasoning: Optional[str]
    state: str
    a_response: Optional[str]
    b_response: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
