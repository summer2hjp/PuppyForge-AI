# backend/tests/test_main.py
import pytest
from fastapi.testclient import TestClient
from main import app


def test_root_endpoint(client):
    """测试根路径健康检查"""
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "healthy"


def test_health_check(client):
    """健康检查接口"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "uptime" in data


def test_docs_available(client):
    """验证 Swagger 文档可用"""
    response = client.get("/docs")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_interact_endpoint(client):
    """测试核心交互接口"""
    response = client.post(
        "/api/interact",
        json={
            "soul_id": "soul_test_001",
            "user_input": "今天心情怎么样？",
            "user_id": "testuser"
        }
    )
    assert response.status_code in [200, 201]
    data = response.json()
    assert "response" in data
    assert "soul" in data
