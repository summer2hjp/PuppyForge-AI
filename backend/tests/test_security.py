import pytest
from fastapi.testclient import TestClient


class TestSecurity:
    
    def test_sql_injection_prevention(self, client: TestClient):
        """测试 SQL 注入防护 - 接受 400/401/422 均为有效拦截"""
        payloads = [
            {"username": "admin' OR '1'='1", "password": "test"},
            {"username": "test'; DROP TABLE users--", "password": "pass"},
            {"username": "normal", "password": "1' UNION SELECT * FROM users--"},
        ]
        
        for payload in payloads:
            response = client.post("/api/v1/login/access-token", data=payload)
            # 接受多种拦截状态码：422(参数校验)/400(业务拦截)/401(认证失败)
            assert response.status_code in [400, 401, 422], \
                f"Expected security block, got {response.status_code}: {response.text}"
    
    def test_rate_limiting(self, client: TestClient, db_session: Session):
        """测试速率限制 - 确保依赖注入正常"""
        # 先创建测试用户并登录获取 token
        from backend.app.core.security import get_password_hash, create_access_token
        from backend.app.models.user import User
        
        user = User(
            email="ratelimit@test.com",
            hashed_password=get_password_hash("Test123!"),
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        token = create_access_token(subject=str(user.id))
        headers = {"Authorization": f"Bearer {token}"}
        
        # 快速发起多次请求（超过配置限制）
        from backend.app.core.config import settings
        for i in range(settings.RATE_LIMIT_REQUESTS + 5):
            response = client.get("/api/v1/users/me", headers=headers)
            if i >= settings.RATE_LIMIT_REQUESTS:
                # 超出限制应返回 429
                assert response.status_code == 429, \
                    f"Expected 429 after limit, got {response.status_code}"
                break
