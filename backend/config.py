from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # 安全配置
    SECRET_KEY: str = "your-super-secret-key-change-in-prod"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://puppyforge.ai"]
    
    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/puppyforge"
    QDRANT_URL: str = "http://localhost:6333"
    
    # LLM
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_MAX_TOKENS: int = 800
    LLM_TEMPERATURE: float = 0.82
    
    # 性能 & 安全
    RATE_LIMIT_PER_MIN: int = 30
    MAX_CONCURRENT_REQUESTS: int = 50
    SOUL_FUEL_DECAY_RATE: float = 0.05
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
