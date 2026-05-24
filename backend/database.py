from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
import logging

from config import settings

logger = logging.getLogger("puppyforge.database")

# ==================== 同步引擎（用于 Alembic） ====================
engine = create_engine(settings.SYNC_DATABASE_URL, echo=settings.ENVIRONMENT == "development")

# ==================== 异步引擎 ====================
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

AsyncSessionLocal = sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# ==================== Qdrant ====================
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
    timeout=10
)


def get_db():
    """同步会话生成器（兼容当前代码）"""
    db = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    """异步会话生成器"""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """初始化数据库表"""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("数据库表初始化完成")


async def init_qdrant():
    """初始化 Qdrant 集合"""
    try:
        collections = qdrant_client.get_collections().collections
        if not any(c.name == "puppy_memories" for c in collections):
            qdrant_client.create_collection(
                collection_name="puppy_memories",
                vectors_config={"size": 1536, "distance": "Cosine"}
            )
            logger.info("Qdrant 记忆集合创建成功")
    except Exception as e:
        logger.error(f"Qdrant 初始化失败: {e}")
