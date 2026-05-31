from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import relationship
from pydantic import BaseModel
import uuid

from models.auth import User
from config import settings


class PetTraits(BaseModel):
    loyalty: float = Field(65.0, ge=0, le=100)
    chaos: float = Field(85.0, ge=0, le=100)
    curiosity: float = Field(92.0, ge=0, le=100)
    aggression: float = Field(48.0, ge=0, le=100)
    affection: float = Field(78.0, ge=0, le=100)
    intelligence: float = Field(70.0, ge=0, le=100)
    rebellion: float = Field(30.0, ge=0, le=100)


class PetMemory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: str  # interaction / drift / evolution / rebellion
    content: str
    impact: float = 0.8
    mood_delta: float = 5.0
    embedding: Optional[List[float]] = None
    source_agent: str = "unknown"


class PuppySoulPydantic(BaseModel):
    id: str
    name: str
    level: int = 1
    experience: int = 0
    traits: PetTraits = Field(default_factory=PetTraits)
    memories: List[PetMemory] = Field(default_factory=list)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    total_interactions: int = 0
    evolution_stage: str = "puppy"
    soul_fuel: float = Field(default_factory=lambda: settings.DEFAULT_SOUL_FUEL)
    rebellion_score: float = 0.0
    owner_id: Optional[str] = None  # 新增：支持 Auth 所有权

    def apply_drift(self, changes: Dict[str, float]):
        """不可逆性格漂移"""
        for trait, delta in changes.items():
            if hasattr(self.traits, trait):
                current = getattr(self.traits, trait)
                new_val = max(0, min(100, current + delta * settings.TRAIT_DRIFT_INTENSITY))
                setattr(self.traits, trait, new_val)
        
        self.experience += int(sum(abs(d) for d in changes.values()))
        self.soul_fuel = max(10.0, self.soul_fuel - settings.SOUL_FUEL_DECAY_RATE * 10)


class SoulEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    soul_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str
    payload: Dict[str, Any]


class InteractionResult(BaseModel):
    soul: PuppySoulPydantic
    response: str
    trait_changes: Dict[str, float]
    agent_insights: Dict[str, Any] = Field(default_factory=dict)
    memory_injected: bool = True


class ErrorResponse(BaseModel):
    message: str
    detail: Optional[str] = None


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
