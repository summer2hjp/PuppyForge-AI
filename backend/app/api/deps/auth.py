"""
backend/app/api/deps/auth.py
认证依赖模块：OAuth2 方案、Token 生成/解析、用户权限守卫
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

# ⚠️ 请根据实际项目结构调整以下导入路径
from backend.app.core.config import settings
from backend.app.core.security import verify_password
from backend.app.db.session import get_db
from backend.app.models.user import User

# =============================================================================
# OAuth2 方案定义
# =============================================================================
# 指向登录接口路径，供 Swagger UI 和客户端自动获取 Token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/login/access-token"
)

# =============================================================================
# 核心工具函数
# =============================================================================
def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    验证邮箱+密码，返回 User 对象或 None
    自动使用 security.py 中修复过的 verify_password（支持 72 字节截断）
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    生成 JWT Access Token
    subject: 通常传入 user.id
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# =============================================================================
# FastAPI 依赖注入（供路由使用）
# =============================================================================
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    解析 Bearer Token，返回当前认证用户
    测试时会被 conftest.py 的 app.dependency_overrides 拦截
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """确保用户处于激活状态（is_active=True）"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未激活"
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """确保用户具有管理员角色"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    return current_user