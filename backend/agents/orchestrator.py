from pydantic import BaseModel
from typing import Dict, Any, List
from .diagnosis_agent import DiagnosisAgent

class SwarmResult(BaseModel):
    diagnosis: Dict[str, Any]
    health_score: float
    recommendations: List[str]
    persona_impact: Dict[str, float]
    forge_triggered: bool = True


class SwarmOrchestrator:
    """
    前端轻量 + 后端重计算混合 Swarm 编排器
    负责 Diagnosis → Prediction → Growth 的顺序/并行调度
    """

    def __init__(self):
        self.diagnosis_agent = DiagnosisAgent()
        # 后续可扩展 PredictionAgent、GrowthAgent、RebelAgent

    async def run(self, puppy_id: str, input_data: Dict[str, Any]) -> SwarmResult:
        """主编排流程"""
        # 1. 诊断阶段（支持视觉输入）
        diagnosis = await self.diagnosis_agent.analyze(input_data)

        # 2. 计算健康分数与人格影响
        health_score = self._calculate_health_score(diagnosis)
        persona_impact = await self._compute_persona_impact(diagnosis, input_data)

        # 3. 生成建议（可后续扩展多 Agent）
        recommendations = diagnosis.get("suggestions", []) + [
            "记录本次互动以强化长期记忆",
            "建议 7 天后复测观察 Trait Drift"
        ]

        return SwarmResult(
            diagnosis=diagnosis,
            health_score=health_score,
            recommendations=recommendations,
            persona_impact=persona_impact
        )

    def _calculate_health_score(self, diagnosis: Dict) -> float:
        """健康分计算逻辑"""
        base_score = 88.0
        risk = diagnosis.get("risk_level", 1)
        confidence = diagnosis.get("confidence", 0.8)
        return max(25, min(100, base_score - risk * 8 + confidence * 5))

    async def _compute_persona_impact(self, diagnosis: Dict, input_data: Dict) -> Dict[str, float]:
        """人格影响预估（可后续接入 LLM）"""
        return {
            "energy": 0.08 if "活跃" in input_data.get("context", "") else 0.03,
            "trust": 0.12 if diagnosis.get("risk_level", 5) < 4 else -0.05,
            "attachment": 0.07
        }
