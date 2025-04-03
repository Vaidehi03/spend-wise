from sqlalchemy import create_engine
from app.models.user import User
from app.models.category import Category
from app.db.database import Base, SessionLocal
from app.utils.security import get_password_hash
from app.core.config import settings

def init_db():
    """Initialize the database with tables and default data"""
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    db = SessionLocal()
    
    # Add default categories if they don't exist
    default_categories = [
        {"name": "Food & Dining", "description": "Restaurants, groceries, and food delivery", "is_expense": True, "is_system": True},
        {"name": "Shopping", "description": "Retail purchases and online shopping", "is_expense": True, "is_system": True},
        {"name": "Transportation", "description": "Public transit, gas, ride shares", "is_expense": True, "is_system": True},
        {"name": "Entertainment", "description": "Movies, events, and subscriptions", "is_expense": True, "is_system": True},
        {"name": "Housing", "description": "Rent, mortgage, and utilities", "is_expense": True, "is_system": True},
        {"name": "Health", "description": "Medical expenses and fitness", "is_expense": True, "is_system": True},
        {"name": "Education", "description": "Tuition, books, and courses", "is_expense": True, "is_system": True},
        {"name": "Travel", "description": "Flights, hotels, and vacations", "is_expense": True, "is_system": True},
        {"name": "Income", "description": "Salary and other income sources", "is_expense": False, "is_system": True},
        {"name": "Investment", "description": "Returns from investments", "is_expense": False, "is_system": True},
    ]
    
    # Check if categories already exist
    if db.query(Category).count() == 0:
        for cat_data in default_categories:
            category = Category(**cat_data)
            db.add(category)
    
    # Create a default admin user if no users exist
    if db.query(User).count() == 0:
        admin_user = User(
            email="admin@example.com",
            full_name="Admin User",
            hashed_password=get_password_hash("adminpassword"),
            is_active=True
        )
        db.add(admin_user)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!") 