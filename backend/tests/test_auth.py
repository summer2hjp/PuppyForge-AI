"""
Authentication tests - fixed for bcrypt 72-byte limit
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.core.security import get_password_hash, verify_password
from backend.app.models.user import User


def test_get_current_user_valid(client: TestClient, db_session: Session, test_user: dict):
    """测试有效 token 获取当前用户"""
    from backend.app.core.security import create_access_token
    
    token = create_access_token(subject=str(test_user["id"]))
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]


def test_password_truncation():
    """验证长密码截断逻辑"""
    # 构造 >72 字节的密码（中文 + 英文混合）
    long_password = "a" * 50 + "测试" * 20  # 约 110 字节
    hashed = get_password_hash(long_password)
    
    # 截断后的密码应能验证通过
    assert verify_password(long_password, hashed) is True
    
    # 原始密码前 72 字节也应能通过（验证截断一致性）
    truncated = long_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    assert verify_password(truncated, hashed) is True


def test_login_with_long_password(client: TestClient, test_user: dict):
    """测试使用长密码登录"""
    long_pwd = "x" * 100
    # 更新用户密码（使用截断后的哈希）
    from backend.app.core.security import get_password_hash
    test_user["hashed_password"] = get_password_hash(long_pwd)
    
    response = client.post(
        "/api/v1/login/access-token",
        data={
            "username": test_user["email"],
            "password": long_pwd  # 发送原始长密码
        }
    )
    # 应登录成功（内部已截断处理）
    assert response.status_code == 200
    assert "access_token" in response.json()