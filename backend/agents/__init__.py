from .base_agent import BaseAgent
from .diagnosis_agent import DiagnosisAgent
from .growth_agent import GrowthAgent
from .prediction_agent import PredictionAgent
from .rebel_agent import RebelAgent
from .trait_drift_agent import TraitDriftAgent
from .memory_weaver import MemoryWeaver

__all__ = [
    "BaseAgent", "DiagnosisAgent", "GrowthAgent",
    "PredictionAgent", "RebelAgent", "TraitDriftAgent",
    "MemoryWeaver"
]

# 全局单例（生产环境建议用依赖注入）
diagnosis_agent = DiagnosisAgent()
growth_agent = GrowthAgent()
prediction_agent = PredictionAgent()
rebel_agent = RebelAgent()
trait_drift_agent = TraitDriftAgent()
memory_weaver = MemoryWeaver()
