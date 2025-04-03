from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class KeywordBase(BaseModel):
    """Base Keyword Schema"""
    keyword: str

class KeywordCreate(KeywordBase):
    """Schema for creating a keyword"""
    pass

class KeywordResponse(KeywordBase):
    """Schema for keyword response"""
    id: int
    category_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class CategoryBase(BaseModel):
    """Base Category Schema"""
    name: str
    description: Optional[str] = None
    is_expense: bool = True
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    """Schema for creating a category"""
    pass

class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_expense: Optional[bool] = None
    parent_id: Optional[int] = None

class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: int
    user_id: Optional[int] = None
    is_system: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    keywords: Optional[List[KeywordResponse]] = []
    
    class Config:
        orm_mode = True

class CategoryWithChildren(CategoryResponse):
    """Schema for category with children"""
    children: List['CategoryWithChildren'] = []
    
    class Config:
        orm_mode = True

# This is needed to handle the recursive definition
CategoryWithChildren.update_forward_refs() 