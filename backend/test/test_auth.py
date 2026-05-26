import pytest
from httpx import AsyncClient
from backend.auth import create_user, verify_user_password, get_current_user

@pytest.mark.asyncio
async def test_create_user_success(client, db_session):
    response = await client.post("/auth/register", json={
        "email": "test@puppyforge.ai",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!"
    })
    assert response.status_code == 201
    assert "user" in response.json()
    assert response.json()["message"] == "注册成功"

@pytest.mark.asyncio
async def test_create_user_email_exists(client, db_session):
    # 先创建用户
    await client.post("/auth/register", json={
        "email": "exist@puppyforge.ai", "password": "Pass123!", "confirm_password": "Pass123!"
    })
    response = await client.post("/auth/register", json={
        "email": "exist@puppyforge.ai", "password": "Pass123!", "confirm_password": "Pass123!"
    })
    assert response.status_code == 409
    assert "已被注册" in response.json()["message"]

@pytest.mark.asyncio
async def test_login_success(client, db_session):
    # 注册后登录
    await client.post("/auth/register", json={
        "email": "login@puppyforge.ai", "password": "Pass123!", "confirm_password": "Pass123!"
    })
    response = await client.post("/auth/login", json={
        "email": "login@puppyforge.ai", "password": "Pass123!"
    })
    assert response.status_code == 200
    assert "token" in response.json()

@pytest.mark.asyncio
async def test_login_invalid_password(client):
    response = await client.post("/auth/login", json={
        "email": "wrong@puppyforge.ai", "password": "wrongpass"
    })
    assert response.status_code == 401
