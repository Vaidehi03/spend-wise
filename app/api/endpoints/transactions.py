from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.transaction_parser import TransactionParser
from app.api.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_transactions(
    file: UploadFile = File(...),
    bank_type: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a bank transaction file and parse transactions"""
    transaction_parser = TransactionParser()
    
    try:
        # Save the uploaded file
        file_path = await transaction_parser.save_upload_file(file)
        
        # Parse the file
        transactions = transaction_parser.parse_file(file_path, bank_type)
        
        # Save transactions to database
        db_transactions = []
        for tx_data in transactions:
            db_tx = Transaction(
                user_id=current_user.id,
                transaction_date=tx_data["transaction_date"],
                amount=tx_data["amount"],
                description=tx_data["description"],
                merchant=tx_data["merchant"],
                is_expense=tx_data["is_expense"],
                source_file=file.filename
            )
            db.add(db_tx)
            db_transactions.append(db_tx)
        
        db.commit()
        
        return {
            "message": f"Successfully uploaded and processed {len(db_transactions)} transactions",
            "file_name": file.filename,
            "transaction_count": len(db_transactions)
        }
    
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category_id: Optional[int] = None,
    is_expense: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user transactions with optional filtering"""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    # Apply filters if provided
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)
    if is_expense is not None:
        query = query.filter(Transaction.is_expense == is_expense)
    
    # Order by date (most recent first)
    query = query.order_by(Transaction.transaction_date.desc())
    
    # Apply pagination
    transactions = query.offset(skip).limit(limit).all()
    
    return transactions

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Transaction not found"
        )
    
    return transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a transaction"""
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Transaction not found"
        )
    
    # Update transaction attributes
    for key, value in transaction.dict(exclude_unset=True).items():
        setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Transaction not found"
        )
    
    db.delete(db_transaction)
    db.commit()
    
    return None 