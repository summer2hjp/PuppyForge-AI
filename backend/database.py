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

# --- 🛡️ 核心修复：动态构建引擎参数，彻底隔离 SQLite ---
IS_SQLITE = "sqlite" in DATABASE_URL.lower()

# 基础必传参数
engine_kwargs = {
    "echo": settings.DEBUG,
}

if IS_SQLITE:
    # SQLite 专属配置：无连接池 + 线程安全
    connect_args = {"check_same_thread": False}
    engine_kwargs.update({
        "poolclass": StaticPool if ":memory:" in DATABASE_URL else NullPool,
        "connect_args": connect_args,
        # 🚫 绝对不传 pool_size/max_overflow/pool_recycle/pool_pre_ping
    })
else:
    # PostgreSQL/MySQL 高并发配置
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 3600,
    })

# 🚀 安全创建引擎：参数字典按需注入
engine: AsyncEngine = create_async_engine(DATABASE_URL, **engine_kwargs)

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