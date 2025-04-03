from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.category import Category
from app.models.category_keyword import CategoryKeyword
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, KeywordCreate
from app.api.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
def get_categories(
    type: Optional[str] = None,  # 'expense' or 'income'
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all categories for the current user, including system categories"""
    query = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.is_system == True)
    )
    
    # Filter by type if provided
    if type:
        is_expense = type.lower() == 'expense'
        query = query.filter(Category.is_expense == is_expense)
    
    # Filter by parent ID if provided
    if parent_id is not None:
        query = query.filter(Category.parent_id == parent_id)
    else:
        # Only top-level categories if parent_id not specified
        query = query.filter(Category.parent_id == None)
    
    categories = query.order_by(Category.name).all()
    return categories

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific category by ID"""
    category = db.query(Category).filter(
        Category.id == category_id,
        ((Category.user_id == current_user.id) | (Category.is_system == True))
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found"
        )
    
    return category

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    # Check if parent category exists if specified
    if category.parent_id:
        parent = db.query(Category).filter(
            Category.id == category.parent_id,
            ((Category.user_id == current_user.id) | (Category.is_system == True))
        ).first()
        
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
    
    # Create new category
    db_category = Category(
        name=category.name,
        description=category.description,
        is_expense=category.is_expense,
        parent_id=category.parent_id,
        user_id=current_user.id,
        is_system=False  # User can't create system categories
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a category"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found or you don't have permission to edit it"
        )
    
    # Don't allow modification of system categories
    if db_category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be modified"
        )
    
    # Update category attributes
    for key, value in category.dict(exclude_unset=True).items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found or you don't have permission to delete it"
        )
    
    # Don't allow deletion of system categories
    if db_category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be deleted"
        )
    
    # Check if category has transactions - if so, don't allow deletion
    if db_category.transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category that has transactions. Reassign transactions first."
        )
    
    # Check if category has children - if so, don't allow deletion
    if db_category.children:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category that has subcategories. Delete subcategories first."
        )
    
    db.delete(db_category)
    db.commit()
    
    return None

@router.post("/{category_id}/keywords", status_code=status.HTTP_201_CREATED)
def add_category_keyword(
    category_id: int,
    keyword: KeywordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a keyword for auto-categorization"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        ((Category.user_id == current_user.id) | (Category.is_system == True))
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found"
        )
    
    # Check if keyword already exists for this category
    existing = db.query(CategoryKeyword).filter(
        CategoryKeyword.category_id == category_id,
        CategoryKeyword.keyword == keyword.keyword
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This keyword already exists for this category"
        )
    
    # Create new keyword
    db_keyword = CategoryKeyword(
        category_id=category_id,
        keyword=keyword.keyword
    )
    
    db.add(db_keyword)
    db.commit()
    db.refresh(db_keyword)
    
    return {
        "id": db_keyword.id,
        "category_id": db_keyword.category_id,
        "keyword": db_keyword.keyword
    }

@router.delete("/{category_id}/keywords/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_keyword(
    category_id: int,
    keyword_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category keyword"""
    # Check if the category belongs to the user
    db_category = db.query(Category).filter(
        Category.id == category_id,
        ((Category.user_id == current_user.id) | (Category.is_system == True))
    ).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found"
        )
    
    # Find the keyword
    db_keyword = db.query(CategoryKeyword).filter(
        CategoryKeyword.id == keyword_id,
        CategoryKeyword.category_id == category_id
    ).first()
    
    if not db_keyword:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keyword not found"
        )
    
    db.delete(db_keyword)
    db.commit()
    
    return None 