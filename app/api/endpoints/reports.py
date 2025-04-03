from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.transaction import TransactionAnalytics
from app.api.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/summary", response_model=TransactionAnalytics)
def get_transaction_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a summary of transactions with analytics"""
    # Set default date range if not provided (last 30 days)
    if not end_date:
        end_date = datetime.now()
    else:
        end_date = datetime.fromisoformat(end_date)
    
    if not start_date:
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.fromisoformat(start_date)
    
    # Get all transactions in the date range
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    ).all()
    
    # Calculate totals
    total_expense = sum(tx.amount for tx in transactions if tx.is_expense)
    total_income = sum(tx.amount for tx in transactions if not tx.is_expense)
    net_cashflow = total_income - total_expense
    
    # Get top expense categories
    expense_by_category = {}
    for tx in transactions:
        if tx.is_expense and tx.category_id:
            category_id = tx.category_id
            if category_id not in expense_by_category:
                expense_by_category[category_id] = 0
            expense_by_category[category_id] += tx.amount
    
    # Get category names
    category_ids = list(expense_by_category.keys())
    categories = {
        cat.id: cat.name 
        for cat in db.query(Category).filter(Category.id.in_(category_ids)).all()
    }
    
    # Format expense by category
    top_expense_categories = [
        {"category_id": cat_id, "category_name": categories.get(cat_id, "Uncategorized"), "amount": amount}
        for cat_id, amount in sorted(expense_by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Get top income categories
    income_by_category = {}
    for tx in transactions:
        if not tx.is_expense and tx.category_id:
            category_id = tx.category_id
            if category_id not in income_by_category:
                income_by_category[category_id] = 0
            income_by_category[category_id] += tx.amount
    
    # Format income by category
    top_income_categories = [
        {"category_id": cat_id, "category_name": categories.get(cat_id, "Uncategorized"), "amount": amount}
        for cat_id, amount in sorted(income_by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Calculate monthly breakdown
    monthly_breakdown = []
    for tx in transactions:
        month = tx.transaction_date.strftime("%Y-%m")
        month_entry = next((m for m in monthly_breakdown if m["month"] == month), None)
        
        if not month_entry:
            month_entry = {
                "month": month, 
                "expense": 0, 
                "income": 0,
                "net": 0
            }
            monthly_breakdown.append(month_entry)
        
        if tx.is_expense:
            month_entry["expense"] += tx.amount
        else:
            month_entry["income"] += tx.amount
        
        month_entry["net"] = month_entry["income"] - month_entry["expense"]
    
    # Sort by month
    monthly_breakdown.sort(key=lambda x: x["month"])
    
    return {
        "total_expense": total_expense,
        "total_income": total_income,
        "net_cashflow": net_cashflow,
        "transaction_count": len(transactions),
        "top_expense_categories": top_expense_categories,
        "top_income_categories": top_income_categories,
        "monthly_breakdown": monthly_breakdown
    }

@router.get("/monthly")
def get_monthly_report(
    year: int = Query(..., description="Year for the report"),
    month: Optional[int] = Query(None, description="Month for the report (1-12)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a detailed monthly report"""
    query = db.query(
        Transaction.category_id,
        Category.name.label("category_name"),
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count")
    ).join(
        Category, Transaction.category_id == Category.id, isouter=True
    ).filter(
        Transaction.user_id == current_user.id,
        extract('year', Transaction.transaction_date) == year
    )
    
    if month:
        query = query.filter(extract('month', Transaction.transaction_date) == month)
    
    # Group by category
    result = query.group_by(
        Transaction.category_id,
        Category.name
    ).order_by(func.sum(Transaction.amount).desc()).all()
    
    # Format the result
    categories = []
    for row in result:
        categories.append({
            "category_id": row.category_id,
            "category_name": row.category_name or "Uncategorized",
            "total_amount": row.total_amount,
            "transaction_count": row.transaction_count
        })
    
    # Get total expense and income
    expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        extract('year', Transaction.transaction_date) == year,
        Transaction.is_expense == True
    )
    
    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        extract('year', Transaction.transaction_date) == year,
        Transaction.is_expense == False
    )
    
    if month:
        expenses = expenses.filter(extract('month', Transaction.transaction_date) == month)
        income = income.filter(extract('month', Transaction.transaction_date) == month)
    
    total_expense = expenses.scalar() or 0
    total_income = income.scalar() or 0
    
    return {
        "year": year,
        "month": month,
        "total_expense": total_expense,
        "total_income": total_income,
        "net": total_income - total_expense,
        "categories": categories
    }

@router.get("/category-comparison")
def get_category_comparison(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category_ids: List[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare spending across different categories over time"""
    # Set default date range if not provided (last 90 days)
    if not end_date:
        end_date = datetime.now()
    else:
        end_date = datetime.fromisoformat(end_date)
    
    if not start_date:
        start_date = end_date - timedelta(days=90)
    else:
        start_date = datetime.fromisoformat(start_date)
    
    # Base query for transactions in the date range
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date
    )
    
    # If category IDs are provided, filter by them
    if category_ids:
        query = query.filter(Transaction.category_id.in_(category_ids))
    
    transactions = query.all()
    
    # Get all relevant categories
    category_ids_used = set(tx.category_id for tx in transactions if tx.category_id)
    categories = {
        cat.id: cat.name 
        for cat in db.query(Category).filter(Category.id.in_(category_ids_used)).all()
    }
    
    # Organize data by month and category
    monthly_data = {}
    for tx in transactions:
        month = tx.transaction_date.strftime("%Y-%m")
        category_id = tx.category_id or 0  # Use 0 for uncategorized
        
        if month not in monthly_data:
            monthly_data[month] = {}
        
        if category_id not in monthly_data[month]:
            monthly_data[month][category_id] = 0
        
        monthly_data[month][category_id] += tx.amount
    
    # Format the result
    result = []
    for month, categories_data in sorted(monthly_data.items()):
        month_data = {"month": month}
        
        for cat_id, amount in categories_data.items():
            cat_name = categories.get(cat_id, "Uncategorized")
            month_data[cat_name] = amount
        
        result.append(month_data)
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "monthly_data": result
    } 