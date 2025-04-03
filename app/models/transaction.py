from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    transaction_date = Column(DateTime)
    amount = Column(Float)
    description = Column(String)
    merchant = Column(String)
    is_expense = Column(Boolean, default=True)  # True for expense, False for income
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Source file info
    source_file = Column(String)
    transaction_id = Column(String, nullable=True)  # Original transaction ID from bank
    
    # Metadata
    is_recurring = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions") 