#!/usr/bin/env python3

from app.db.database import engine, SessionLocal
from sqlalchemy import text
from datetime import datetime, timedelta
import random

db = SessionLocal()
user_id = 1  # The user we've authenticated with

# Sample data - Indian context
transactions = [
    # Food & Dining (Category ID 11)
    {'date': datetime.now() - timedelta(days=2), 'amount': 380.00, 'desc': 'Dinner at restaurant', 'merchant': 'Barbeque Nation', 'is_expense': True, 'cat_id': 11},
    {'date': datetime.now() - timedelta(days=6), 'amount': 1450.00, 'desc': 'Monthly groceries', 'merchant': 'Big Bazaar', 'is_expense': True, 'cat_id': 11},
    {'date': datetime.now() - timedelta(days=10), 'amount': 110.00, 'desc': 'Tea and snacks', 'merchant': 'Chai Point', 'is_expense': True, 'cat_id': 11},

    # Transportation (Category ID 12)
    {'date': datetime.now() - timedelta(days=3), 'amount': 1800.00, 'desc': 'Fuel refill', 'merchant': 'Indian Oil', 'is_expense': True, 'cat_id': 12},
    {'date': datetime.now() - timedelta(days=7), 'amount': 320.00, 'desc': 'Cab ride', 'merchant': 'Ola Cabs', 'is_expense': True, 'cat_id': 12},

    # Entertainment (Category ID 13)
    {'date': datetime.now() - timedelta(days=5), 'amount': 699.00, 'desc': 'Streaming subscription', 'merchant': 'Hotstar', 'is_expense': True, 'cat_id': 13},
    {'date': datetime.now() - timedelta(days=12), 'amount': 450.00, 'desc': 'Movie tickets', 'merchant': 'BookMyShow', 'is_expense': True, 'cat_id': 13},

    # Income (Category ID 14)
    {'date': datetime.now() - timedelta(days=1), 'amount': 72000.00, 'desc': 'Monthly salary', 'merchant': 'Infosys Ltd', 'is_expense': False, 'cat_id': 14},
    {'date': datetime.now() - timedelta(days=30), 'amount': 70000.00, 'desc': 'Monthly salary', 'merchant': 'Infosys Ltd', 'is_expense': False, 'cat_id': 14},
]

for t in transactions:
    query = text('''
        INSERT INTO transactions 
        (user_id, transaction_date, amount, description, merchant, is_expense, category_id, created_at) 
        VALUES 
        (:user_id, :date, :amount, :desc, :merchant, :is_expense, :cat_id, :created_at)
    ''')

    db.execute(query, {
        'user_id': user_id,
        'date': t['date'],
        'amount': t['amount'],
        'desc': t['desc'],
        'merchant': t['merchant'],
        'is_expense': t['is_expense'],
        'cat_id': t['cat_id'],
        'created_at': datetime.now()
    })

db.commit()
db.close()
print('Sample Indian transactions added successfully ✅')
