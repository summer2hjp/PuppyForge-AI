"""
Password hashing utilities with bcrypt 72-byte limit handling
"""
import bcrypt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
from jose import jwt

from backend.app.core.config import settings

# bcrypt 最大密码长度限制（72 字节）
BCRYPT_MAX_BYTES = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str) -> str:
    """
    安全截断密码至 72 字节，避免 bcrypt 报错
    注意：截断基于 UTF-8 字节，非字符数
    """
    if not password:
        return password
    encoded = password.encode('utf-8')
    if len(encoded) <= BCRYPT_MAX_BYTES:
        return password
    # 截断后尝试解码，忽略不完整的多字节字符
    return encoded[:BCRYPT_MAX_BYTES].decode('utf-8', errors='ignore')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码，自动处理长度截断"""
    truncated = _truncate_password(plain_password)
    return pwd_context.verify(truncated, hashed_password)


def get_password_hash(password: str) -> str:
    """生成密码哈希，自动处理长度截断"""
    truncated = _truncate_password(password)
    return pwd_context.hash(truncated)


def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None,
    token_type: str = "access"
) -> str:
    """生成 JWT access token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": token_type
    }
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """生成 JWT refresh token"""
    return create_access_token(
        subject=subject,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh"
    )