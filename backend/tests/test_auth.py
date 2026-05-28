# backend/tests/test_auth.py
import pytest
from datetime import timedelta
from jose import jwt
from fastapi import HTTPException

from auth import (
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user,
)
from models.auth import UserCreate, User


def test_password_hashing():
    password = "puppy123!Strong"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpass", hashed) is False


def test_create_access_token():
    data = {"sub": "user123"}
    token = create_access_token(data, expires_delta=timedelta(minutes=15))
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["sub"] == "user123"
    assert "exp" in payload


@pytest.mark.asyncio
async def test_get_current_user_valid(client, test_db):
    # 先创建测试用户
    user = User(
        id="testuser123",
        email="test@puppyforge.ai",
        hashed_password=get_password_hash("testpass"),
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()

    token = create_access_token({"sub": "testuser123"})
    
    # 这里需要模拟 Depends（实际测试中推荐使用 client）
    # 或通过集成测试验证


def test_login_success(client):
    # 创建用户
    response = client.post(
        "/auth/login",
        json={"email": "test@puppyforge.ai", "password": "testpass"}
    )
    # 根据实际 login 实现调整断言
    assert response.status_code in [200, 201]


def test_login_invalid_password(client):
    response = client.post(
        "/auth/login",
        json={"email": "test@puppyforge.ai", "password": "wrong"}
    )
    assert response.status_code == 401
