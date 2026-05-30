# backend/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session
from sqlalchemy import create_engine as sync_create_engine
from typing import AsyncGenerator, Generator

# ====================== 配置 ======================
TESTING = os.getenv("TESTING", "false").lower() == "true"

if TESTING:
    DATABASE_URL = "sqlite+aiosqlite:///:memory:"
    SYNC_DATABASE_URL = "sqlite:///:memory:"
    echo_sql = True
    print("🧪 测试模式 - 使用 SQLite 内存数据库")
else:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        DATABASE_URL = "sqlite+aiosqlite:///:memory:"  # 兜底
    SYNC_DATABASE_URL = DATABASE_URL.replace("+aiosqlite", "").replace("+asyncpg", "")
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    echo_sql = False

# ====================== SQLAlchemy 引擎 ======================
# 异步引擎
engine = create_async_engine(
    DATABASE_URL,
    echo=echo_sql,
    future=True,
    pool_pre_ping=True,
)

# 同步引擎（用于测试）
sync_engine = sync_create_engine(
    SYNC_DATABASE_URL,
    echo=echo_sql,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in SYNC_DATABASE_URL else {},
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def get_sync_db() -> Generator[Session, None, None]:
    """同步数据库会话（用于测试）"""
    session = Session(sync_engine)
    try:
        yield session
    finally:
        session.close()


# ====================== Qdrant 客户端（新增） ======================
qdrant_client = None

def get_qdrant_client():
    """懒加载 Qdrant 客户端"""
    global qdrant_client
    if qdrant_client is None:
        try:
            from qdrant_client import QdrantClient
            qdrant_client = QdrantClient(
                url=os.getenv("QDRANT_URL", "http://localhost:6333"),
                api_key=os.getenv("QDRANT_API_KEY")
            )
        except Exception as e:
            print(f"⚠️ Qdrant 初始化失败: {e}")
            qdrant_client = None
    return qdrant_client


# ====================== 初始化 ======================
async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def drop_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
