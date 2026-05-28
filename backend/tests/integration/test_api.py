# backend/tests/integration/test_api.py
import pytest
from fastapi.testclient import TestClient


def test_auth_login_flow(client):
    """完整登录流程测试"""
    # 注册
    register_resp = client.post(
        "/auth/register",
        json={
            "email": "test_integration@puppyforge.ai",
            "password": "StrongPass123!",
            "username": "testuser"
        }
    )
    assert register_resp.status_code in [200, 201]

    # 登录
    login_resp = client.post(
        "/auth/login",
        json={"email": "test_integration@puppyforge.ai", "password": "StrongPass123!"}
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_soul_diagnosis_flow(client):
    """灵魂诊断完整流程"""
    response = client.post(
        "/api/diagnose",
        json={
            "soul_id": "soul_test_001",
            "description": "小狗活泼好动，喜欢追球",
            "image_base64": None
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "diagnosis" in data
    assert "trait_analysis" in data


def test_orchestrator_interact(client):
    """Multi-Agent 编排交互测试"""
    response = client.post(
        "/api/interact",
        json={
            "soul_id": "soul_test_001",
            "message": "我今天带它去公园玩了",
            "context": {"mood": "happy"}
        }
    )
    assert response.status_code == 200
    assert "response" in response.json()
    assert "updated_soul" in response.json()
