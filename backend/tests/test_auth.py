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
from config import settings


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
    # 先创建测试用户 - 使用传入的 test_db session
    user = User(
        email="test@puppyforge.ai",
        hashed_password=get_password_hash("testpass"),
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    # 通过 API 验证 token - 使用正确的路由前缀 /api/v1/auth/me
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200


def test_login_success(client, test_db):
    # 创建用户
    user = User(
        email="test@puppyforge.ai",
        hashed_password=get_password_hash("testpass"),
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@puppyforge.ai", "password": "testpass"}
    )
    # 根据实际 login 实现调整断言
    assert response.status_code in [200, 201]


def test_login_invalid_password(client, test_db):
    # 先创建用户
    user = User(
        email="test2@puppyforge.ai",
        hashed_password=get_password_hash("testpass"),
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test2@puppyforge.ai", "password": "wrong"}
    )
    assert response.status_code == 401
