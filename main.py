import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import transactions, categories, reports, users
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="An expense tracking application that analyzes bank transactions",
    version="0.1.0"
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
