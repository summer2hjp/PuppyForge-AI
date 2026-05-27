from __future__ import annotations
from typing import Optional, List, Dict, TYPE_CHECKING
from uuid import uuid4
from datetime import datetime

from pydantic import BaseModel, Field as PydanticField
from sqlmodel import SQLModel, Field, Relationship, Column, JSON

if TYPE_CHECKING:
    from .auth import User

try:
    from backend.config import settings
except ImportError:
    from config import settings


class PetTraits(BaseModel):
    """宠物性格特征模型"""
    loyalty: float = PydanticField(65.0, ge=0, le=100)
    chaos: float = PydanticField(85.0, ge=0, le=100)
    curiosity: float = PydanticField(92.0, ge=0, le=100)
    aggression: float = PydanticField(48.0, ge=0, le=100)
    affection: float = PydanticField(78.0, ge=0, le=100)
    intelligence: float = PydanticField(70.0, ge=0, le=100)
    rebellion: float = PydanticField(30.0, ge=0, le=100)


class PetMemory(SQLModel, table=True):
    """宠物记忆模型"""
    __tablename__ = "pet_memories"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    soul_id: str = Field(foreign_key="puppy_souls.id", index=True)
    memory_type: str = Field(default="interaction")
    content: str
    emotional_impact: float = Field(default=0.0)
    importance: int = Field(default=1, ge=1, le=10)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # ✅ 重命名：metadata → extra_data
    extra_data: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    
    # 关系 - 使用字符串前向引用
    soul: "PuppySoul" = Relationship(back_populates="memories")


class EvolutionStage(SQLModel, table=True):
    """进化阶段配置"""
    __tablename__ = "evolution_stages"
    
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    stage_name: str = Field(unique=True, index=True)
    min_level: int = Field(default=1)
    required_experience: int = Field(default=0)
    traits_multiplier: float = Field(default=1.0)
    description: Optional[str] = None


class PuppySoul(SQLModel, table=True):
    """宠物灵魂核心表"""
    __tablename__ = "puppy_souls"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    level: int = Field(default=1, ge=1)
    experience: int = Field(default=0, ge=0)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    total_interactions: int = Field(default=0, ge=0)
    evolution_stage: str = Field(default="puppy")
    soul_fuel: float = Field(default=100.0)
    rebellion_score: float = Field(default=0.0, ge=0.0)
    
    # 外键关系
    owner_id: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    owner: Optional["User"] = Relationship(back_populates="souls")
    
    # 一对多关系
    memories: List["PetMemory"] = Relationship(
        back_populates="soul",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    
    # 性格特征（JSON 存储）
    traits: PetTraits = Field(
        default_factory=PetTraits,
        sa_column=Column(JSON)
    )

    def apply_drift(self, changes: Dict[str, float]):
        """应用性格漂移"""
        for trait, delta in changes.items():
            if hasattr(self.traits, trait):
                current = getattr(self.traits, trait)
                new_value = max(0.0, min(100.0, current + delta))
                setattr(self.traits, trait, new_value)
    
    def get_traits_dict(self) -> Dict[str, float]:
        """获取特征字典"""
        return self.traits.model_dump()
    
    def update_traits(self, **kwargs):
        """批量更新特征值"""
        current = self.traits.model_dump()
        current.update(kwargs)
        for key, value in current.items():
            current[key] = max(0.0, min(100.0, value))
        self.traits = PetTraits(**current)
    
    def add_experience(self, amount: int):
        """增加经验值"""
        self.experience += amount
        self._check_level_up()
    
    def _check_level_up(self):
        """检查是否升级"""
        exp_needed = self.level * 100
        while self.experience >= exp_needed:
            self.experience -= exp_needed
            self.level += 1
            self.soul_fuel = min(200.0, self.soul_fuel + 20.0)
            exp_needed = self.level * 100
    
    def interact(self):
        """记录一次互动"""
        self.total_interactions += 1
        self.last_active = datetime.utcnow()
        self.soul_fuel = max(0.0, self.soul_fuel - 1.0)
    
    @property
    def is_active(self) -> bool:
        """判断宠物是否活跃"""
        if self.last_active:
            delta = datetime.utcnow() - self.last_active
            return delta.days < 1
        return False
    
    @property
    def dominance_trait(self) -> str:
        """获取最显著的性格特征"""
        traits_dict = self.get_traits_dict()
        return max(traits_dict, key=traits_dict.get)


# === 事件模型 ===

class SoulEvent(BaseModel):
    """灵魂事件记录"""
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    soul_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str
    payload: Dict[str, Any]


# === API 模型 ===

class PuppySoulCreate(BaseModel):
    """创建宠物灵魂请求"""
    name: str
    traits: Optional[PetTraits] = None


class PuppySoulRead(BaseModel):
    """宠物灵魂响应"""
    id: str
    name: str
    level: int
    experience: int
    evolution_stage: str
    soul_fuel: float
    rebellion_score: float
    total_interactions: int
    last_active: datetime
    traits: Dict[str, float]
    owner_id: Optional[str] = None


class PuppySoulUpdate(BaseModel):
    """更新宠物灵魂请求"""
    name: Optional[str] = None
    traits: Optional[PetTraits] = None


class TraitDriftRequest(BaseModel):
    """性格漂移请求"""
    changes: Dict[str, float]
