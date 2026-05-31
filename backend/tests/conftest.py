import pytest
from unittest.mock import AsyncMock, patch
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from fastapi.testclient import TestClient
from main import app
from database import get_db
from agents.orchestrator import SwarmOrchestrator

# 使用内存 SQLite 进行异步测试
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="function")
async def test_db():
    # 创建表
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    async with async_session_maker() as session:
        yield session
    
    # 删除表
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest.fixture
def client(test_db):
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_external_services():
    with patch('agents.orchestrator.SwarmOrchestrator') as mock_orch:
        mock_orch.return_value.run_full_diagnosis = AsyncMock()
        yield

@pytest.fixture
async def orchestrator():
    """提供 SwarmOrchestrator 实例用于测试"""
    orch = SwarmOrchestrator()
    # Mock run_full_diagnosis 方法以避免实际调用外部服务
    with patch.object(orch, 'run_full_diagnosis', new_callable=AsyncMock) as mock_run:
        # 设置默认返回值
        mock_run.return_value = {
            "health_score": 95,
            "soul_traits": ["playful", "loyal"],
            "recommendations": ["Regular exercise", "Balanced diet"]
        }
        yield orch
