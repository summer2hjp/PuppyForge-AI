import asyncio
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    async_sessionmaker, 
    create_async_engine,
    AsyncEngine
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from config import settings

# --- 配置数据库 URL ---
DATABASE_URL = settings.DATABASE_URL

# 自动处理 SQLite 的异步前缀
# 如果配置的是 sqlite://，自动转换为 sqlite+aiosqlite://
if DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")

# 如果是内存数据库，需要特殊配置连接池
connect_args = {}
if DATABASE_URL == "sqlite+aiosqlite:///:memory:":
    connect_args["check_same_thread"] = False
    # 内存数据库必须使用 StaticPool 并禁用池回收
    poolclass = StaticPool
else:
    poolclass = None # 使用默认池 (如 QueuePool)

# --- 创建异步引擎 ---
engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,  # 开发环境打印 SQL
    future=True,
    pool_pre_ping=True,   # 连接前检查有效性
    pool_size=10 if not poolclass else None,      # 连接池大小
    max_overflow=20 if not poolclass else None,   # 最大溢出连接数
    pool_recycle=3600,    # 连接回收时间 (秒)
    poolclass=poolclass,
    connect_args=connect_args
)

# --- 创建异步 Session 工厂 ---
# class_=AsyncSession 确保 session 是异步的
# expire_on_commit=False 防止提交后访问属性时触发异步加载错误
async_session_maker = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# --- 依赖注入函数 ---
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    异步获取数据库会话依赖注入。
    用法: db: AsyncSession = Depends(get_db)
    """
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
    """
    初始化数据库表结构。
    在应用启动时调用 (lifespan)。
    """
    async with engine.begin() as conn:
        # run_sync 用于在异步上下文中执行同步的 metadata.create_all
        await conn.run_sync(SQLModel.metadata.create_all)

async def drop_db() -> None:
    """
    删除所有表结构 (仅用于测试或重置)。
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    异步上下文管理器获取会话。
    用法: async with get_db_context() as session: ...
    适用于不在 FastAPI 依赖注入中的场景 (如后台任务)。
    """
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
    """
    检查数据库连接是否健康。
    返回 True 表示连接正常。
    """
    try:
        async with async_session_maker() as session:
            await session.exec("SELECT 1")
        return True
    except Exception:
        return False
