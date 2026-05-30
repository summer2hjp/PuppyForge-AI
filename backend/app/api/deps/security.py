"""
Security dependencies: injection detection, rate limiting, auth guards
"""
import re
import time
from collections import defaultdict
from typing import Optional, Callable
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.core.security import verify_password
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.core.config import settings

# ========== SQL 注入检测 ==========

SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|EXECUTE)\b)",
    r"(--|;|/\*|\*/|@@|@)",
    r"(\b(OR|AND)\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+)",
    r"(\b(OR|AND)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+)",
    r"(xp_|sp_|0x[0-9a-f]+)",
]

COMPILED_PATTERNS = [re.compile(p, re.I | re.M) for p in SQL_INJECTION_PATTERNS]


def detect_sql_injection(value: str) -> bool:
    """检测字符串是否包含 SQL 注入特征"""
    if not value or not isinstance(value, str):
        return False
    return any(pattern.search(value) for pattern in COMPILED_PATTERNS)


def validate_no_injection(value: str, field_name: str = "input") -> str:
    """校验并抛出异常（用于 Pydantic validator 或 API 前置检查）"""
    if detect_sql_injection(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Potential SQL injection detected in {field_name}"
        )
    return value


# ========== 简易内存速率限制（测试用，生产请换 Redis） ==========

class SimpleRateLimiter:
    """
    内存版速率限制器（仅用于测试环境）
    生产环境请使用 Redis + Lua 实现原子计数
    """
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._store: dict[str, list[float]] = defaultdict(list)
    
    def is_allowed(self, key: str) -> bool:
        now = time.time()
        # 清理过期记录
        self._store[key] = [
            ts for ts in self._store[key] 
            if now - ts < self.window_seconds
        ]
        if len(self._store[key]) >= self.max_requests:
            return False
        self._store[key].append(now)
        return True


# 全局速率限制器实例（测试环境）
_test_rate_limiter = SimpleRateLimiter(
    max_requests=settings.RATE_LIMIT_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WINDOW
)


def rate_limit_dependency(
    request: Request,
    db: Session = Depends(get_db)
) -> bool:
    """
    速率限制依赖（按 IP + 用户 ID 组合键）
    返回 True 表示允许通过，否则抛出 429
    """
    # 获取标识键：优先用户 ID，降级为 IP
    user = getattr(request.state, "user", None)
    key = f"user:{user.id}" if user and hasattr(user, "id") else f"ip:{request.client.host}"
    
    if not _test_rate_limiter.is_allowed(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    return True


# ========== 认证依赖 ==========

def get_current_user(
    token: str = Depends(oauth2_scheme),  # 需从 backend.app.api.deps.auth 导入
    db: Session = Depends(get_db)
) -> User:
    """
    获取当前认证用户
    注意：需配合 backend/app/api/deps/auth.py 的 oauth2_scheme 使用
    """
    from backend.app.core.security import decode_token  # 需实现
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """确保用户处于激活状态"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """确保用户具有管理员权限"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user