from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel, Field as PydanticField
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

from config import settings


class PetTraits(BaseModel):
    loyalty: float = PydanticField(65.0, ge=0, le=100)
    chaos: float = PydanticField(85.0, ge=0, le=100)
    curiosity: float = PydanticField(92.0, ge=0, le=100)
    aggression: float = PydanticField(48.0, ge=0, le=100)
    affection: float = PydanticField(78.0, ge=0, le=100)
    intelligence: float = PydanticField(70.0, ge=0, le=100)
    rebellion: float = PydanticField(30.0, ge=0, le=100)


class PetMemory(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    soul_id: str = Field(foreign_key="puppysoul.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: str
    content: str
    impact: float = 0.8
    mood_delta: float = 5.0
    source_agent: str = "unknown"


class PuppySoul(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    level: int = Field(default=1)
    experience: int = Field(default=0)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    total_interactions: int = Field(default=0)
    evolution_stage: str = Field(default="puppy")
    soul_fuel: float = Field(default=settings.DEFAULT_SOUL_FUEL)
    rebellion_score: float = Field(default=0.0)
    owner_id: Optional[str] = Field(default=None, foreign_key="user.id")

    # 关系
    owner: Optional["User"] = Relationship(back_populates="souls")
    memories: List[PetMemory] = Relationship(back_populates="soul")

    # Pydantic 模型用于 API
    traits: PetTraits = PydanticField(default_factory=PetTraits)

    def apply_drift(self, changes: Dict[str, float]):
        for trait, delta in changes.items():
            if hasattr(self.traits, trait):
                current = getattr(self.traits, trait)
                new_val = max(0, min(100, current + delta))
                setattr(self.traits, trait, new_val)
        
        self.experience += int(sum(abs(d) for d in changes.values()))
        self.soul_fuel = max(10.0, self.soul_fuel - settings.SOUL_FUEL_DECAY_RATE * 10)


class InteractionResult(BaseModel):
    soul: PuppySoul
    response: str
    trait_changes: Dict[str, float]
    agent_insights: Dict[str, Any] = {}
    memory_injected: bool = True
