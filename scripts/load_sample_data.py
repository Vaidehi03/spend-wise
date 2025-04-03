#!/usr/bin/env python
"""
Script to load sample transaction data for testing the SpendWise application.
This creates realistic sample transactions for a test user.
"""

import sys
import os
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from app.models.category import Category

# Sample merchants for different categories
MERCHANTS = {
    "Food & Dining": [
        "Trader Joe's", "Whole Foods", "Local Grocery", "Subway", 
        "McDonald's", "Starbucks", "Chipotle", "Pizza Hut"
    ],
    "Shopping": [
        "Amazon", "Target", "Walmart", "Best Buy", "Apple Store", 
        "Home Depot", "IKEA", "Macy's"
    ],
    "Transportation": [
        "Uber", "Lyft", "Transit Authority", "Shell", "Chevron", 
        "Exxon", "Car Repair Shop", "Auto Parts Store"
    ],
    "Entertainment": [
        "Netflix", "Spotify", "Movie Theater", "Concert Venue", "Xbox", 
        "Steam", "Bookstore", "Theme Park"
    ],
    "Housing": [
        "Rent Payment", "Mortgage", "Electric Company", "Water Utility", 
        "Gas Company", "Internet Provider", "Home Insurance"
    ],
    "Income": [
        "Paycheck", "Direct Deposit", "Freelance Payment", "Client Payment",
        "Tax Refund", "Interest Income", "Dividend Payment"
    ]
}

def create_sample_transactions(db: Session, user_id: int, num_transactions: int = 50):
    """Create sample transactions for a user"""
    print(f"Creating {num_transactions} sample transactions for user ID {user_id}...")
    
    # Get all categories from the database
    categories = {cat.name: cat for cat in db.query(Category).all()}
    
    # End date is today, start date is 3 months ago
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)
    date_range = (end_date - start_date).days
    
    transactions = []
    for _ in range(num_transactions):
        # Random date within the last 3 months
        tx_date = start_date + timedelta(days=random.randint(0, date_range))
        
        # Determine if this is an expense or income (80% chance of expense)
        is_expense = random.random() < 0.8
        
        if is_expense:
            # Pick a random expense category
            expense_categories = [name for name, cat in categories.items() 
                                 if cat.is_expense and name in MERCHANTS]
            category_name = random.choice(expense_categories)
            merchant = random.choice(MERCHANTS[category_name])
            
            # Generate a random amount between $1 and $200 for expenses
            amount = round(random.uniform(1, 200), 2)
            description = f"Purchase at {merchant}"
        else:
            # For income
            category_name = "Income"
            merchant = random.choice(MERCHANTS["Income"])
            
            # Generate a random amount between $500 and $3000 for income
            amount = round(random.uniform(500, 3000), 2)
            description = f"Income from {merchant}"
        
        # Create the transaction
        transaction = Transaction(
            user_id=user_id,
            transaction_date=tx_date,
            amount=amount,
            description=description,
            merchant=merchant,
            is_expense=is_expense,
            category_id=categories[category_name].id,
            source_file="sample_data.py"
        )
        
        transactions.append(transaction)
    
    # Add all transactions to the database
    db.add_all(transactions)
    db.commit()
    
    print(f"Successfully created {num_transactions} sample transactions!")

def main():
    db = SessionLocal()
    try:
        # Check if the admin user exists
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        
        if not admin_user:
            print("Error: Admin user not found. Please run init_db.py first.")
            return
        
        # Create sample transactions for the admin user
        create_sample_transactions(db, admin_user.id, 100)
        
    finally:
        db.close()

if __name__ == "__main__":
    main() 