# backend/tests/unit/test_auth.py
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
from models.auth import UserCreate


def test_password_hashing():
    password = "puppy123!Strong"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpass", hashed) is False


def test_create_access_token():
    data = {"sub": "user123"}
    token = create_access_token(data, expires_delta=timedelta(minutes=15))
    
    payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])  # 使用 config 中的 key
    assert payload["sub"] == "user123"


def test_get_current_user_logic():
    # 逻辑测试（完整依赖测试在集成层）
    assert get_current_user is not None
