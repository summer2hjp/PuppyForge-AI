import pytest
from httpx import AsyncClient
from auth import create_access_token

@pytest.mark.asyncio
class TestSecurity系统测试:

    async def test_sql_injection_prevention(self, client):
        """SQL注入防护测试"""
        malicious_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "<script>alert('xss')</script>"
        ]
        
        for payload in malicious_payloads:
            response = await client.post("/auth/login", json={
                "email": payload,
                "password": "password"
            })
            assert response.status_code in [400, 401]  # 拒绝恶意输入

    async def test_jwt_token_validation(self, client):
        """JWT Token安全验证"""
        # 无效Token
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = await client.get("/protected-route", headers=headers)
        assert response.status_code == 401

        # 过期Token
        expired_token = create_access_token({"sub": "test"}, expires_delta=-3600)
        response = await client.get("/protected-route", headers={"Authorization": f"Bearer {expired_token}"})
        assert response.status_code == 401

    async def test_rate_limiting(self, client):
        """请求频率限制测试"""
        for _ in range(20):
            await client.post("/auth/login", json={"email": "test@puppyforge.ai", "password": "pass"})
        response = await client.post("/auth/login", json={"email": "test@puppyforge.ai", "password": "pass"})
        assert response.status_code == 429  # Too Many Requests
