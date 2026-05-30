from __future__ import annotations
from enum import Enum
from uuid import uuid4
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    """用户角色枚举"""
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


# 延迟导入以避免循环依赖
if TYPE_CHECKING:
    PuppySoul = None  # type: ignore


class User(SQLModel, table=True):
    """用户模型"""
    __tablename__ = "users"  # 可选，指定表名
    
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: Optional[str] = None
    is_active: bool = True
    role: UserRole = Field(default=UserRole.USER)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # OAuth 信息
    google_id: Optional[str] = Field(default=None, unique=True)
    github_id: Optional[str] = Field(default=None, unique=True)
    
    # 关系 - 使用字符串前向引用（SQLModel 会在运行时解析）
    souls: "PuppySoul" = Relationship(
        back_populates="owner",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    
    class Config:
        """Pydantic 配置"""
        arbitrary_types_allowed = False  # 保持严格模式
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "is_active": True,
                "role": "user",
            }
        }


class UserCreate(BaseModel):
    """创建用户请求模型"""
    email: EmailStr
    password: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "strongpassword123",
            }
        }


class UserRead(BaseModel):
    """用户信息响应模型"""
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "role": "user",
                "is_active": True,
            }
        }


class UserUpdate(BaseModel):
    """更新用户请求模型（可选）"""
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


class Token(BaseModel):
    """JWT Token 响应模型"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token 数据模型"""
    email: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[UserRole] = None
