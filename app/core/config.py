import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SpendWise"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # File Upload Settings
    UPLOAD_DIR: str = os.path.join("app", "static", "uploads")
    ALLOWED_EXTENSIONS: list = ["csv", "xlsx", "xls", "json", "pdf"]
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB

    class Config:
        case_sensitive = True

# Create settings instance
settings = Settings() 