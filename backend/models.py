from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class PetTraits(BaseModel):
    loyalty: float = 65.0
    chaos: float = 85.0
    curiosity: float = 92.0
    aggression: float = 48.0
    affection: float = 78.0
    intelligence: float = 70.0


class PetMemory(BaseModel):
    id: str
    timestamp: datetime
    type: str  # interaction / evolution / trait_drift
    content: str
    impact: float
    mood_delta: float


class PuppySoul(BaseModel):
    id: str
    name: str
    level: int = 1
    experience: int = 0
    traits: PetTraits = Field(default_factory=PetTraits)
    memories: List[PetMemory] = Field(default_factory=list)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    total_interactions: int = 0
    evolution_stage: str = "puppy"  # puppy → rebel → legend


class InteractionResult(BaseModel):
    soul: PuppySoul
    response: str
    trait_changes: Dict[str, float]
    memory_injected: bool


class EvolutionResult(BaseModel):
    soul: PuppySoul
    level_up: bool
    new_stage: str
    trait_summary: Dict[str, float]


class VisionDiagnosis(BaseModel):
    mood: int
    health: int
    suggestions: List[str]
    trait_impact: Dict[str, float]
