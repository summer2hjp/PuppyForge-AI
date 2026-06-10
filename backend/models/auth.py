import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from enum import Enum

from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, String, DateTime, Boolean, BigInteger, Text
from sqlalchemy.orm import relationship

# 防止循环导入
if TYPE_CHECKING:
    from models.soul import PuppySoul
    from models.interaction import Interaction
    from models.diagnosis import Diagnosis


class UserRole(str, Enum):
    """用户角色枚举"""
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserBase(SQLModel):
    """用户基础模型"""
    email: str = Field(..., unique=True, index=True, max_length=255, description="邮箱地址")
    role: UserRole = Field(default=UserRole.USER, description="用户角色")
    is_active: bool = Field(default=True, description="是否激活")
    is_verified: bool = Field(default=False, description="邮箱是否验证")
    full_name: Optional[str] = Field(None, max_length=100, description="全名")
    avatar_url: Optional[str] = Field(None, max_length=500, description="头像 URL")


class UserCreate(SQLModel):
    """用户注册/创建请求模型"""
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=72, description="密码 (6-72字符)")
    full_name: Optional[str] = Field(None, max_length=100, description="全名") 


class UserRead(UserBase):
    """用户响应模型 (不包含敏感信息)"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserUpdate(SQLModel):
    """用户更新请求模型"""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
    
class User(UserBase, table=True):
    """用户数据库模型"""
    __tablename__ = "users"

    id: int = Field(
        default_factory=lambda: uuid.uuid4().int >> 96, 
        primary_key=True, 
        index=True,
        sa_type=BigInteger,
        description="用户ID (基于UUID缩短的BigInt)"
    )
    
    hashed_password: str = Field(..., sa_column=Column(String(255)), description="加密后的密码")
    created_at: datetime = Field(default_factory=get_utc_now, sa_column=Column(DateTime))    
    updated_at: Optional[datetime] = Field(
        None, 
        sa_column=Column(DateTime, onupdate=get_utc_now)
    )

    # --- 反向关系定义 (用于级联查询) ---
    # 注意：确保引用的模型已正确导入且定义了 back_populates
    souls: List["PuppySoul"] = Relationship(back_populates="user", cascade_delete=True)
    interactions: List["Interaction"] = Relationship(back_populates="user", cascade_delete=True)
    diagnoses: List["Diagnosis"] = Relationship(back_populates="user", cascade_delete=True)
    api_keys: List["ApiKey"] = Relationship(back_populates="user", cascade_delete=True)


class ApiKeyBase(SQLModel):
    """API Key 基础模型"""
    name: str = Field(max_length=100, description="API Key 名称/标识")
    is_active: bool = Field(default=True, description="是否激活")


class ApiKeyCreate(SQLModel):
    """创建 API Key 请求模型"""
    name: str = Field(max_length=100, description="API Key 名称")
    expires_in_days: Optional[int] = Field(None, description="过期天数（可选）")


class ApiKeyRead(ApiKeyBase):
    """API Key 响应模型（不包含原始 key）"""
    id: int
    key_prefix: str = Field(max_length=11, description="Key 前缀（pf_ + 前8位）")
    user_id: int
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None


class ApiKeyCreateResponse(SQLModel):
    """创建 API Key 响应（包含一次性原始 key）"""
    id: int
    name: str
    key_prefix: str
    api_key: str = Field(description="完整 API Key（仅创建时返回一次）")
    user_id: int
    created_at: datetime
    expires_at: Optional[datetime] = None


class ApiKey(ApiKeyBase, table=True):
    """API Key 数据库模型"""
    __tablename__ = "api_keys"

    id: int = Field(primary_key=True, sa_type=BigInteger)
    key_prefix: str = Field(max_length=11, sa_column=Column(String(11), index=True), description="Key 前缀（用于快速查找）")
    key_hash: str = Field(max_length=128, sa_column=Column(String(128)), description="Key 的 SHA-256 哈希")
    user_id: int = Field(foreign_key="users.id", sa_type=BigInteger, index=True, description="所属用户 ID")
    created_at: datetime = Field(default_factory=get_utc_now, sa_column=Column(DateTime))
    expires_at: Optional[datetime] = Field(None, sa_column=Column(DateTime, nullable=True), description="过期时间")
    last_used_at: Optional[datetime] = Field(None, sa_column=Column(DateTime, nullable=True), description="最后使用时间")

    # --- 关系 ---
    user: Optional["User"] = Relationship(back_populates="api_keys")
