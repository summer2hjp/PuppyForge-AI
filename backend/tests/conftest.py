"""
Pytest fixtures for PuppyForge-AI test suite
"""
import os
import pytest
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.base import Base
from backend.app.core.config import settings

# 使用内存 SQLite（最快）或文件 SQLite（便于调试）
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "sqlite:///:memory:"  # 内存数据库，每次测试自动重置
)

# 如果是文件数据库，确保清理
TEST_DB_FILE = "./test_puppyforge.db" if "sqlite:///" in TEST_DATABASE_URL and ":memory:" not in TEST_DATABASE_URL else None


@pytest.fixture(scope="session")
def db_engine() -> Generator:
    """创建测试数据库引擎 + 自动执行 Alembic 迁移"""
    connect_args = {"check_same_thread": False} if "sqlite" in TEST_DATABASE_URL else {}
    
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args=connect_args,
        poolclass=StaticPool if ":memory:" in TEST_DATABASE_URL else None,
        echo=False  # 生产测试建议关闭 SQL 日志
    )
    
    # 执行 Alembic 迁移（确保表结构最新）
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(alembic_cfg, "head")
    
    yield engine
    
    # 清理文件数据库（内存数据库自动释放）
    if TEST_DB_FILE and os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """
    为每个测试函数创建独立 DB session，支持事务回滚隔离
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    
    SessionLocal = sessionmaker(
        bind=connection, 
        autocommit=False, 
        autoflush=False
    )
    session = SessionLocal()
    
    # 绑定会话到请求（供 Depends(get_db) 使用）
    def override_get_db() -> Session:
        try:
            yield session
        finally:
            session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield session
    
    # 回滚事务，确保测试隔离
    transaction.rollback()
    connection.close()
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient，自动注入测试 DB session"""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> dict:
    """创建测试用户数据工厂"""
    from backend.app.models.user import User
    from backend.app.core.security import get_password_hash
    
    user_data = {
        "email": f"test_{os.urandom(4).hex()}@example.com",
        "hashed_password": get_password_hash("TestPass123!"),
        "is_active": True,
        "role": "user"
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "password": "TestPass123!",
        "role": user.role
    }


@pytest.fixture(scope="function")
def admin_user(db_session: Session) -> dict:
    """创建管理员测试用户"""
    from backend.app.models.user import User
    from backend.app.core.security import get_password_hash
    
    user_data = {
        "email": f"admin_{os.urandom(4).hex()}@example.com",
        "hashed_password": get_password_hash("AdminPass456!"),
        "is_active": True,
        "role": "admin"
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "password": "AdminPass456!",
        "role": user.role
    }