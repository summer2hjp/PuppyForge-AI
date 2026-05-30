import asyncio
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlmodel import SQLModel, create_engine, text  # ✅ 添加 text 用于原生查询
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    async_sessionmaker, 
    create_async_engine,
    AsyncEngine
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, NullPool

from config import settings

# --- 配置数据库 URL ---
DATABASE_URL = settings.DATABASE_URL

# 自动处理 SQLite 的异步前缀
if DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")

# 🛡️ 核心修复：检测所有 SQLite 变体 (文件/内存)，统一剥离池化参数
IS_SQLITE = "sqlite" in DATABASE_URL.lower()

connect_args = {}
if IS_SQLITE:
    connect_args["check_same_thread"] = False
    # 内存数据库必须用 StaticPool，文件数据库用 NullPool (SQLite 默认)
    poolclass = StaticPool if ":memory:" in DATABASE_URL else NullPool
else:
    poolclass = None  # PostgreSQL/MySQL 使用默认 QueuePool

# --- 创建异步引擎 ---
# 🚀 激进传参：仅非 SQLite 时注入池化配置，避免 TypeError
engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    # future=True,  # SQLAlchemy 2.0+ 默认开启，可移除
    pool_pre_ping=True if not IS_SQLITE else False,  # SQLite 无需 ping 检查
    pool_size=10 if not IS_SQLITE else None,
    max_overflow=20 if not IS_SQLITE else None,
    pool_recycle=3600 if not IS_SQLITE else None,
    poolclass=poolclass,
    connect_args=connect_args
)

# --- 创建异步 Session 工厂 ---
async_session_maker = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# --- 依赖注入函数 ---
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# --- 初始化工具函数 ---
async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def drop_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# --- 健康检查辅助函数 ---
async def check_db_health() -> bool:
    try:
        async with async_session_maker() as session:
            # ✅ 修复：SQLModel exec 需要 text() 包装原生 SQL
            await session.exec(text("SELECT 1"))
        return True
    except Exception:
        return False