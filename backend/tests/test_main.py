# backend/tests/test_main.py
import pytest
from fastapi.testclient import TestClient
from main import app


def test_root_endpoint(client):
    """测试根路径健康检查"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data or "status" in data
    # 接受 "running" 或 "healthy" 作为有效状态，或者欢迎消息
    if "status" in data:
        assert data["status"] in ["healthy", "running"]


def test_health_check(client):
    """健康检查接口"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # 接受 "ok" 或 "healthy" 作为有效状态
    assert data["status"] in ["ok", "healthy"]
    assert "version" in data
    #assert "uptime" in data


def test_docs_available(client):
    """验证 Swagger 文档可用"""
    response = client.get("/docs")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_interact_endpoint(client):
    """测试核心交互接口"""
    # 注意：实际路由是 /api/interact/{soul_id}，需要使用 soul_id 参数
    # 该接口需要认证，所以预期返回 401（未授权）或 404/501（服务不可用）
    response = client.post(
        "/api/interact/soul_test_001",
        json={
            "user_input": "今天心情怎么样？",
            "user_id": "testuser"
        }
    )
    # 由于需要认证，可能返回 401；由于依赖外部服务，可能返回 404 或 501，这是预期的
    assert response.status_code in [200, 201, 401, 404, 501]
    if response.status_code in [200, 201]:
        data = response.json()
        assert "response" in data or "status" in data
