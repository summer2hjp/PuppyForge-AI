from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """PuppyForge-AI 全局配置（v4.2）"""

    # ==================== 项目基础 ====================
    PROJECT_NAME: str = "PuppyForge-AI"
    VERSION: str = "4.2.0"
    ENVIRONMENT: str = "development"  # development | staging | production

    # ==================== 安全配置 ====================
    SECRET_KEY: str = "CHANGE_THIS_TO_A_VERY_SECURE_RANDOM_STRING_IN_PRODUCTION_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7天

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://puppyforge.ai",
        "https://*.puppyforge.ai",
    ]

    # ==================== 数据库配置 ====================
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/puppyforge"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/puppyforge"  # 用于 Alembic

    # Qdrant 向量数据库
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None

    # ==================== LLM 配置 ====================
    LLM_MODEL: str = "gpt-4o-mini"          # 可换成 gpt-4o, claude-3.5-sonnet 等
    LLM_TEMPERATURE: float = 0.85
    LLM_MAX_TOKENS: int = 1200
    LLM_TIMEOUT: int = 25

    # LiteLLM 配置（推荐使用）
    LITELLM_MASTER_KEY: Optional[str] = None

    # ==================== OAuth 配置 ====================
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/auth/github/callback"

    # ==================== 性能 & 限流 ====================
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_CONCURRENT_REQUESTS: int = 80

    # ==================== 灵魂引擎配置 ====================
    DEFAULT_SOUL_FUEL: float = 100.0
    SOUL_FUEL_DECAY_RATE: float = 0.08
    MAX_MEMORIES_PER_SOUL: int = 200
    TRAIT_DRIFT_INTENSITY: float = 1.0

    # ==================== 文件上传配置 ====================
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]

    # ==================== Redis（可选，未来用于 Celery + 缓存） ====================
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# 单例模式，性能优化
@lru_cache()
def get_settings() -> Settings:
    return Settings()


# 全局快捷访问
settings = get_settings()
