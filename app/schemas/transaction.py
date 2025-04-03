from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    """Base Transaction Schema"""
    transaction_date: datetime
    amount: float
    description: str
    merchant: Optional[str] = None
    is_expense: bool = True
    category_id: Optional[int] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = False

class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    user_id: int
    source_file: Optional[str] = None
    transaction_id: Optional[str] = None

class TransactionUpdate(BaseModel):
    """Schema for updating a transaction"""
    transaction_date: Optional[datetime] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    is_expense: Optional[bool] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None

class TransactionResponse(TransactionBase):
    """Schema for transaction response"""
    id: int
    user_id: int
    source_file: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class TransactionUploadResponse(BaseModel):
    """Schema for transaction upload response"""
    message: str
    file_name: str
    transaction_count: int

class TransactionAnalytics(BaseModel):
    """Schema for transaction analytics"""
    total_expense: float
    total_income: float
    net_cashflow: float
    transaction_count: int
    top_expense_categories: List[dict]
    top_income_categories: List[dict]
    monthly_breakdown: List[dict]

class BulkTransactionDelete(BaseModel):
    """Schema for bulk transaction deletion"""
    transaction_ids: List[int] 