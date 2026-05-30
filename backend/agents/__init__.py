from .base_agent import BaseAgent
from .trait_drift_agent import TraitDriftAgent
from .memory_weaver import MemoryWeaver
from .rebel_agent import RebelAgent
from .diagnosis_agent import DiagnosisAgent
from .growth_agent import GrowthAgent
from .prediction_agent import PredictionAgent
from .vision_agent import VisionAgent
from .memory_agent import MemoryAgent

# 单例实例
trait_drift_agent = TraitDriftAgent()
memory_weaver = MemoryWeaver()
rebel_agent = RebelAgent()
diagnosis_agent = DiagnosisAgent()
growth_agent = GrowthAgent()
prediction_agent = PredictionAgent()
vision_agent = VisionAgent()
memory_agent_instance = MemoryAgent()

__all__ = [
    "BaseAgent",
    "TraitDriftAgent",
    "MemoryWeaver",
    "RebelAgent",
    "DiagnosisAgent",
    "GrowthAgent",
    "PredictionAgent",
    "VisionAgent",
    "MemoryAgent",
    "trait_drift_agent",
    "memory_weaver",
    "rebel_agent",
    "diagnosis_agent",
    "growth_agent",
    "prediction_agent",
    "vision_agent",
    "memory_agent_instance",
]
