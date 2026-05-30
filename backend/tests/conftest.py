# backend/tests/conftest.py
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from sqlalchemy import create_engine as sync_create_engine
from sqlmodel import Session as SyncSession

# 创建同步引擎用于测试（全局共享）
sync_test_engine = sync_create_engine("sqlite:///:memory:", echo=False, connect_args={"check_same_thread": False})

# 全局 Mock 避免导入错误
pytest_plugins = ["pytest_asyncio"]

# Mock Qdrant 和其他外部依赖
@pytest.fixture(autouse=True)
def mock_external_services():
    with patch('database.get_qdrant_client') as mock_qdrant, \
         patch('agents.orchestrator.SwarmOrchestrator') as mock_orch:
        
        mock_qdrant.return_value = MagicMock()
        mock_orch.return_value.run_full_diagnosis = AsyncMock()
        
        yield


@pytest.fixture(scope="function")
def test_db():
    """创建测试数据库会话（同步版本）"""
    # 导入模型以确保它们被注册到 SQLModel.metadata
    from models.auth import User  # noqa: F401
    from models.models import PuppySoul, InteractionResult  # noqa: F401
    
    # 创建所有表
    SQLModel.metadata.create_all(sync_test_engine)
    
    with SyncSession(sync_test_engine) as session:
        yield session
    
    # 清理所有表
    SQLModel.metadata.drop_all(sync_test_engine)


@pytest.fixture
def client(test_db):
    """创建测试客户端，使用测试数据库会话"""
    from main import app
    from database import get_db
    
    def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()


@pytest.fixture
def orchestrator():
    """SwarmOrchestrator 测试夹具"""
    from agents.orchestrator import SwarmOrchestrator
    return SwarmOrchestrator()


@pytest.fixture
def mock_analyze_image():
    """mock analyze_pet_image 的夹具"""
    with patch('vision.analyze_pet_image', new_callable=AsyncMock) as mock:
        yield mock
