import os
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    应用配置管理
    优先读取环境变量，未设置时使用默认值
    """

    # --- 基础配置 ---
    APP_NAME: str = "PuppyForge AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"  # development, production, testing

    # --- 服务器配置 ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["*"]  # 生产环境请限制具体域名

    # --- 安全配置 ---
    # 强烈建议在生产环境中通过环境变量设置此密钥 (openssl rand -hex 32)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change_this_secret_key_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # --- 数据库配置 ---
    # 支持 SQLite (默认), PostgreSQL, MySQL 等
    # SQLite 示例: sqlite:///./puppyforge.db
    # PostgreSQL 示例: postgresql+asyncpg://user:password@localhost/dbname
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./puppyforge.db")

    # --- Redis 配置 (可选，用于缓存/限流/黑名单) ---
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)
    # 格式: redis://localhost:6379/0

    # --- 速率限制配置 ---
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # --- OAuth2 / 第三方登录配置 ---
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/github/callback")

    # --- AI / 外部服务配置 (示例) ---
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    QDRANT_URL: Optional[str] = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_COLLECTION: str = "puppy_souls"

    # --- 日志配置 ---
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # --- LLM 配置 ---
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-5.4-mini")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1024"))
    
    # --- Soul 配置 ---
    DEFAULT_SOUL_FUEL: float = 100.0
    SOUL_FUEL_DECAY_RATE: float = 0.5
    TRAIT_DRIFT_INTENSITY: float = 0.1

    # Pydantic Settings 配置
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # 环境变量不区分大小写
        extra="ignore"  # 忽略额外的环境变量
    )


@lru_cache()
def get_settings() -> Settings:
    """
    获取单例配置实例
    使用 lru_cache 确保配置只加载一次，提高性能
    """
    return Settings()


# 全局配置实例
settings = get_settings()
