from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    is_expense = Column(Boolean, default=True)  # True for expense, False for income
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # If NULL, then it's a system category
    is_system = Column(Boolean, default=False)  # System categories can't be deleted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transactions = relationship("Transaction", back_populates="category")
    parent = relationship("Category", back_populates="children", remote_side=[id])
    children = relationship("Category", back_populates="parent")
    
    # Keyword mapping for auto-categorization
    keywords = relationship("CategoryKeyword", back_populates="category") 