from typing import Dict, Any
from pydantic import BaseModel
from .diagnosis_agent import DiagnosisAgent
# from .prediction_agent import PredictionAgent  # 后续扩展

class SwarmResult(BaseModel):
    diagnosis: Dict[str, Any]
    health_score: float
    recommendations: List[str]
    persona_impact: Dict[str, float]

class SwarmOrchestrator:
    def __init__(self):
        self.diagnosis_agent = DiagnosisAgent()
        # self.prediction_agent = PredictionAgent()

    async def run(self, puppy_id: str, input_data: Dict[str, Any]) -> SwarmResult:
        """MVP 顺序编排：Diagnosis → Impact → Memory Update"""
        
        # 1. 诊断阶段
        diagnosis = await self.diagnosis_agent.analyze(input_data)
        
        # 2. 计算健康分与人格影响
        health_score = self._calculate_health_score(diagnosis)
        persona_impact = {"trust": 0.08, "energy": 0.05}  # 后续由 LLM 动态计算
        
        return SwarmResult(
            diagnosis=diagnosis,
            health_score=health_score,
            recommendations=diagnosis.get("suggestions", []),
            persona_impact=persona_impact
        )

    def _calculate_health_score(self, diagnosis: Dict) -> float:
        base = 85.0
        risk = diagnosis.get("risk_level", 0)
        return max(20, min(100, base - risk * 15))
