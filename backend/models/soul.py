from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import relationship

from models.auth import User


class PuppySoulBase(SQLModel):
    """宠物档案基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="宠物名字")
    breed: Optional[str] = Field(None, max_length=100, description="品种")
    age_months: Optional[int] = Field(None, ge=0, le=300, description="年龄（月）")
    gender: str = Field(..., description="性别: male, female, unknown")
    weight_kg: Optional[float] = Field(None, ge=0.1, le=100.0, description="体重（kg）")
    color: Optional[str] = Field(None, max_length=50, description="毛色")
    personality_traits: Optional[str] = Field(None, sa_column=Column(Text), description="性格特征 JSON 或文本")
    health_notes: Optional[str] = Field(None, sa_column=Column(Text), description="健康备注")
    avatar_url: Optional[str] = Field(None, max_length=500, description="头像 URL")
    is_active: bool = Field(default=True, description="是否激活")


class PuppySoulCreate(PuppySoulBase):
    """创建宠物档案请求模型"""
    pass


class PuppySoulUpdate(SQLModel):
    """更新宠物档案请求模型"""
    name: Optional[str] = None
    breed: Optional[str] = None
    age_months: Optional[int] = None
    gender: Optional[str] = None
    weight_kg: Optional[float] = None
    color: Optional[str] = None
    personality_traits: Optional[str] = None
    health_notes: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class PuppySoulRead(PuppySoulBase):
    """宠物档案响应模型"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class PuppySoul(PuppySoulBase, table=True):
    """宠物档案数据库模型"""
    __tablename__ = "puppy_souls"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(..., foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(None)

    # 关系定义
    user: "User" = Relationship(back_populates="souls")
    # interactions: List["Interaction"] = Relationship(back_populates="soul")
