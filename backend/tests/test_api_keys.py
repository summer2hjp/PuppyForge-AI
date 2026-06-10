import pytest
import hashlib
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
from sqlmodel import select

from auth import (
    API_KEY_PREFIX,
    _hash_api_key,
    _generate_raw_api_key,
    generate_api_key,
    resolve_api_key,
    verify_token_or_api_key,
    create_access_token,
)
from models.auth import ApiKey, ApiKeyCreateResponse, ApiKeyRead, User, UserRole


# --- 单元测试：工具函数 ---


class TestHashApiKey:
    def test_hash_consistency(self):
        """相同 key 产生相同 hash"""
        key = "pf_test_key_123"
        h1 = _hash_api_key(key)
        h2 = _hash_api_key(key)
        assert h1 == h2

    def test_hash_different_keys(self):
        """不同 key 产生不同 hash"""
        h1 = _hash_api_key("pf_key_one")
        h2 = _hash_api_key("pf_key_two")
        assert h1 != h2

    def test_hash_format(self):
        """hash 是 SHA-256 十六进制字符串"""
        key = "pf_test_key_123"
        h = _hash_api_key(key)
        assert len(h) == 64
        int(h, 16)  # 应该是合法的十六进制


class TestGenerateRawApiKey:
    def test_key_prefix(self):
        """生成的 key 以 pf_ 开头"""
        key = _generate_raw_api_key()
        assert key.startswith(API_KEY_PREFIX)

    def test_key_length(self):
        """全长 = 前缀(3) + 64 hex chars = 67"""
        key = _generate_raw_api_key()
        assert len(key) == 67

    def test_key_uniqueness(self):
        """连续生成不应重复"""
        keys = {_generate_raw_api_key() for _ in range(100)}
        assert len(keys) == 100


# --- 集成测试：数据库函数 ---


class TestGenerateAndResolveApiKey:
    @pytest.mark.asyncio
    async def test_generate_api_key_returns_response(self, client, test_db):
        """generate_api_key() 返回 ApiKeyCreateResponse"""
        user = User(
            email="apikey-test@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await generate_api_key(
            db=test_db,
            user_id=user.id,
            name="test-key",
        )
        assert isinstance(result, ApiKeyCreateResponse)
        assert result.name == "test-key"
        assert result.api_key.startswith(API_KEY_PREFIX)
        assert result.user_id == user.id

    @pytest.mark.asyncio
    async def test_generated_key_stored_in_db(self, client, test_db):
        """生成的 key 存入 api_keys 表"""
        user = User(
            email="apikey-store@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await generate_api_key(test_db, user.id, "store-test")
        record = await test_db.execute(
            select(ApiKey).where(ApiKey.id == result.id)
        )
        api_key = record.scalars().first()
        assert api_key is not None
        assert api_key.name == "store-test"
        assert api_key.key_hash == _hash_api_key(result.api_key)
        assert api_key.key_prefix == result.api_key[: len(API_KEY_PREFIX) + 8]

    @pytest.mark.asyncio
    async def test_resolve_api_key_valid(self, client, test_db):
        """resolve_api_key() 正确解析有效 key"""
        user = User(
            email="apikey-resolve@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await generate_api_key(test_db, user.id, "resolve-test")
        resolved = await resolve_api_key(test_db, result.api_key)
        assert resolved is not None
        assert resolved.id == result.id
        assert resolved.is_active is True

    @pytest.mark.asyncio
    async def test_resolve_api_key_invalid(self, client, test_db):
        """无效 key 返回 None"""
        resolved = await resolve_api_key(
            test_db,
            "pf_invalid_key_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        )
        assert resolved is None

    @pytest.mark.asyncio
    async def test_resolve_api_key_wrong_prefix(self, client, test_db):
        """错误前缀返回 None"""
        resolved = await resolve_api_key(test_db, "invalid_key_123")
        assert resolved is None

    @pytest.mark.asyncio
    async def test_resolve_expired_key(self, client, test_db):
        """过期的 key 返回 None 并标记为不活跃"""
        user = User(
            email="apikey-expire@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # 创建已过期的 key
        result = await generate_api_key(test_db, user.id, "expire-test", expires_in_days=-1)

        resolved = await resolve_api_key(test_db, result.api_key)
        assert resolved is None

        # 确认数据库标记为不活跃
        record = await test_db.execute(select(ApiKey).where(ApiKey.id == result.id))
        db_key = record.scalars().first()
        assert db_key.is_active is False

    @pytest.mark.asyncio
    async def test_resolve_key_updates_last_used(self, client, test_db):
        """解析 key 时更新 last_used_at"""
        user = User(
            email="apikey-lastused@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await generate_api_key(test_db, user.id, "lastused-test")
        await resolve_api_key(test_db, result.api_key)

        record = await test_db.execute(select(ApiKey).where(ApiKey.id == result.id))
        db_key = record.scalars().first()
        assert db_key.last_used_at is not None


class TestVerifyTokenOrApiKey:
    @pytest.mark.asyncio
    async def test_verify_jwt(self, client, test_db):
        """JWT token 通过 verify_token_or_api_key"""
        user = User(
            email="verify-jwt@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        payload = await verify_token_or_api_key(token, test_db)
        assert payload is not None
        assert payload["type"] == "jwt"
        assert payload["sub"] == str(user.id)

    @pytest.mark.asyncio
    async def test_verify_api_key(self, client, test_db):
        """API key 通过 verify_token_or_api_key"""
        user = User(
            email="verify-apikey@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        result = await generate_api_key(test_db, user.id, "verify-apikey-test")
        payload = await verify_token_or_api_key(result.api_key, test_db)
        assert payload is not None
        assert payload["type"] == "api_key"
        assert payload["sub"] == str(user.id)

    @pytest.mark.asyncio
    async def test_verify_invalid_returns_none(self, client, test_db):
        """无效输入返回 None"""
        payload = await verify_token_or_api_key("totally_invalid", test_db)
        assert payload is None


# --- API 端点测试 ---


class TestApiKeyEndpoints:
    @pytest.mark.asyncio
    async def test_create_api_key_requires_admin(self, client, test_db):
        """普通用户不能创建 API Key"""
        user = User(
            email="normal-user-create@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.USER,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        response = client.post(
            "/api/v1/auth/api-keys",
            json={"name": "my-key"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_can_create_api_key(self, client, test_db):
        """管理员可以创建 API Key"""
        user = User(
            email="admin-create@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        response = client.post(
            "/api/v1/auth/api-keys",
            json={"name": "admin-key"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "admin-key"
        assert data["api_key"].startswith(API_KEY_PREFIX)
        assert "key_prefix" in data

    @pytest.mark.asyncio
    async def test_create_api_key_with_expiry(self, client, test_db):
        """创建带过期时间的 API Key"""
        user = User(
            email="admin-expire@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        response = client.post(
            "/api/v1/auth/api-keys",
            json={"name": "expiring-key", "expires_in_days": 30},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["expires_at"] is not None

    @pytest.mark.asyncio
    async def test_list_api_keys(self, client, test_db):
        """用户能列出自己的 API Key"""
        user = User(
            email="admin-list@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})

        # 先创建两个 key
        client.post(
            "/api/v1/auth/api-keys",
            json={"name": "key-1"},
            headers={"Authorization": f"Bearer {token}"},
        )
        client.post(
            "/api/v1/auth/api-keys",
            json={"name": "key-2"},
            headers={"Authorization": f"Bearer {token}"},
        )

        response = client.get(
            "/api/v1/auth/api-keys",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    @pytest.mark.asyncio
    async def test_revoke_api_key(self, client, test_db):
        """撤销 API Key"""
        user = User(
            email="admin-revoke@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})

        # 创建
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            json={"name": "revoke-me"},
            headers={"Authorization": f"Bearer {token}"},
        )
        key_id = create_resp.json()["id"]

        # 撤销
        response = client.delete(
            f"/api/v1/auth/api-keys/{key_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

        # 确认 key 不再可用
        record = await test_db.execute(select(ApiKey).where(ApiKey.id == key_id))
        db_key = record.scalars().first()
        assert db_key.is_active is False

    @pytest.mark.asyncio
    async def test_revoke_nonexistent_key_returns_404(self, client, test_db):
        """撤销不存在的 key 返回 404"""
        user = User(
            email="admin-revoke404@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        response = client.delete(
            "/api/v1/auth/api-keys/99999",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_non_admin_cannot_revoke_others_key(self, client, test_db):
        """普通用户不能撤销他人的 key"""
        admin_user = User(
            email="admin-owner@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.ADMIN,
        )
        test_db.add(admin_user)
        normal_user = User(
            email="normal-revoke@puppyforge.ai",
            hashed_password="hashed",
            is_active=True,
            role=UserRole.USER,
        )
        test_db.add(normal_user)
        await test_db.commit()
        await test_db.refresh(admin_user)
        await test_db.refresh(normal_user)

        # 管理员创建 key
        admin_token = create_access_token({"sub": str(admin_user.id)})
        create_resp = client.post(
            "/api/v1/auth/api-keys",
            json={"name": "owner-key"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        key_id = create_resp.json()["id"]

        # 普通用户试图撤销
        normal_token = create_access_token({"sub": str(normal_user.id)})
        response = client.delete(
            f"/api/v1/auth/api-keys/{key_id}",
            headers={"Authorization": f"Bearer {normal_token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_authentication_required(self, client, test_db):
        """未认证请求返回 401"""
        # POST 需要认证
        resp = client.post("/api/v1/auth/api-keys", json={"name": "no-auth"})
        assert resp.status_code in [401, 403]

        # GET 需要认证
        resp = client.get("/api/v1/auth/api-keys")
        assert resp.status_code in [401, 403]

        # DELETE 需要认证
        resp = client.delete("/api/v1/auth/api-keys/1")
        assert resp.status_code in [401, 403]
