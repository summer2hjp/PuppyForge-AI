# backend/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from typing import AsyncGenerator

# ====================== 配置 ======================
DATABASE_URL = os.getenv("DATABASE_URL")

# 测试环境自动切换到 SQLite（解决 async driver 问题）
if os.getenv("TESTING") or not DATABASE_URL:
    DATABASE_URL = "sqlite+aiosqlite:///:memory:"
    echo_sql = True
else:
    # 生产环境建议使用 asyncpg
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    echo_sql = False

# ====================== 引擎创建 ======================
engine = create_async_engine(
    DATABASE_URL,
    echo=echo_sql,
    future=True,
    pool_pre_ping=True,           # 防止连接断开
    pool_size=10,
    max_overflow=20,
)

# ====================== Session ======================
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """依赖注入使用的异步数据库会话"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ====================== 初始化 ======================
async def init_db() -> None:
    """创建所有表（开发/测试使用）"""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def drop_db() -> None:
    """删除所有表（测试清理使用）"""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


# ====================== 健康检查 ======================
async def check_db_connection() -> bool:
    """数据库连接健康检查"""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute("SELECT 1")
        return True
    except Exception:
        return False
