from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

class PetTraits(BaseModel):
    loyalty: float = Field(65.0, ge=0, le=100)
    chaos: float = Field(85.0, ge=0, le=100)
    curiosity: float = Field(92.0, ge=0, le=100)
    aggression: float = Field(48.0, ge=0, le=100)
    affection: float = Field(78.0, ge=0, le=100)
    intelligence: float = Field(70.0, ge=0, le=100)
    rebellion: float = Field(30.0, ge=0, le=100)  # 新增叛逆度

class PetMemory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: str  # interaction / drift / evolution / rebellion
    content: str
    impact: float
    mood_delta: float
    embedding: Optional[List[float]] = None
    source_agent: str = "unknown"

class PuppySoul(BaseModel):
    id: str
    name: str
    level: int = 1
    experience: int = 0
    traits: PetTraits = Field(default_factory=PetTraits)
    memories: List[PetMemory] = Field(default_factory=list)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    total_interactions: int = 0
    evolution_stage: str = "puppy"  # puppy → rebel → legend → god
    soul_fuel: float = 100.0  # 新增灵魂燃料
    rebellion_score: float = 0.0

    def apply_drift(self, changes: Dict[str, float]):
        """不可逆性格漂移"""
        for trait, delta in changes.items():
            if hasattr(self.traits, trait):
                current = getattr(self.traits, trait)
                new_val = max(0, min(100, current + delta))
                setattr(self.traits, trait, new_val)
        
        self.experience += int(sum(abs(d) for d in changes.values()))
        self.soul_fuel = max(10, self.soul_fuel - 5)  # 消耗燃料

class SoulEvent(BaseModel):
    """事件溯源核心"""
    event_id: str
    soul_id: str
    timestamp: datetime
    event_type: str
    payload: Dict[str, Any]
