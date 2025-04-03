from fastapi import APIRouter

from app.api.endpoints import users, transactions, categories, reports

# Create main API router
api_router = APIRouter()

# Register all API routers
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
