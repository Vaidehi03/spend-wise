from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base User Schema"""
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    """Schema for OAuth token response"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for token data"""
    user_id: Optional[str] = None 