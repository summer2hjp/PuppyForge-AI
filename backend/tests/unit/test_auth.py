# backend/tests/unit/test_auth.py
import pytest
from datetime import timedelta
from jose import jwt

# 根据实际 auth.py 结构调整导入
from auth import create_access_token, get_password_hash, verify_password


def test_password_hashing():
    """密码哈希与验证测试"""
    password = "puppyforge2025!"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token():
    """JWT Token 生成测试"""
    data = {"sub": "summer2hjp", "email": "test@puppyforge.ai"}
    token = create_access_token(data, expires_delta=timedelta(minutes=30))
    
    assert token is not None
    assert isinstance(token, str)
    
    # 解码验证
    payload = jwt.decode(token, "your-secret-key-change-in-production", algorithms=["HS256"])
    assert payload["sub"] == "summer2hjp"


def test_token_expiration():
    """Token 过期逻辑（基础验证）"""
    data = {"sub": "testuser"}
    token = create_access_token(data, expires_delta=timedelta(minutes=-1))  # 立即过期
    assert token is not None
