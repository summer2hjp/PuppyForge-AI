from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from models.auth import User


class InteractionBase(SQLModel):
    """互动记录基础模型"""
    content: str = Field(..., min_length=1, max_length=2000, description="互动内容")
    interaction_type: str = Field(..., description="互动类型: play, feed, walk, train, etc.")
    mood_score: Optional[int] = Field(None, ge=1, le=10, description="心情评分 1-10")
    location: Optional[str] = Field(None, max_length=100, description="互动地点")
    image_url: Optional[str] = Field(None, max_length=500, description="相关图片URL")
    notes: Optional[str] = Field(None, sa_column=Column(Text), description="备注信息")


class InteractionCreate(InteractionBase):
    """创建互动记录请求模型"""
    pass


class InteractionUpdate(SQLModel):
    """更新互动记录请求模型"""
    content: Optional[str] = None
    interaction_type: Optional[str] = None
    mood_score: Optional[int] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class InteractionRead(InteractionBase):
    """互动记录响应模型"""
    id: int
    user_id: int
    soul_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class Interaction(InteractionBase, table=True):
    """互动记录数据库模型"""
    __tablename__ = "interactions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(..., foreign_key="users.id", index=True)
    soul_id: Optional[int] = Field(None, foreign_key="puppy_souls.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(None)

    # 关系定义
    user: "User" = Relationship(back_populates="interactions")
    # soul: "PuppySoul" = Relationship(back_populates="interactions")  # 如果定义了反向关系
