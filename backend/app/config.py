from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    
    MODEL_NAME: str = "gemini-2.0-flash"
    MAX_TOKENS: int = 1000
    TEMPERATURE: float = 0.7
    
    CHUNK_SIZE: int = 5000
    MAX_DOCUMENTS_PER_BATCH: int = 5
    
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB default

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
