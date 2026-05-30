# backend/tests/conftest.py
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient

# 全局 Mock 避免导入错误
pytest_plugins = ["pytest_asyncio"]

# Mock Qdrant 和其他外部依赖
@pytest.fixture(autouse=True)
def mock_external_services():
    with patch('database.get_qdrant_client') as mock_qdrant, \
         patch('orchestrator.SoulOrchestrator') as mock_orch:
        
        mock_qdrant.return_value = MagicMock()
        mock_orch.return_value.interact = MagicMock()
        
        yield


@pytest.fixture
def client():
    """创建测试客户端"""
    from main import app
    with TestClient(app) as c:
        yield c


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
