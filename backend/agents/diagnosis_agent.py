from pydantic import BaseModel
from typing import Dict, List, Optional

class DiagnosisResult(BaseModel):
    condition: str
    confidence: float
    risk_level: int  # 1-10
    suggestions: List[str]
    explanation: str
    visual_features: Optional[Dict[str, Any]] = None


class DiagnosisAgent:
    async def analyze(self, input_data: Dict[str, Any]) -> Dict:
        """支持视觉 + 文本的多模态诊断"""
        context = input_data.get("context", "")
        visual = input_data.get("visual_features", {})

        # 模拟智能诊断逻辑（生产环境接入 GPT-4o / LLaVA）
        risk = 4 if any(k in context.lower() for k in ["红斑", "皮肤", "痒"]) else 2

        return {
            "condition": "轻度皮肤敏感" if risk > 3 else "整体健康良好",
            "confidence": 0.87,
            "risk_level": risk,
            "suggestions": [
                "补充 Omega-3 脂肪酸",
                "保持皮肤干燥清洁",
                "观察 48-72 小时",
                "必要时咨询兽医"
            ],
            "explanation": "基于视觉特征与历史记忆的综合神经诊断",
            "visual_features": visual or {"skin_condition": "mild_redness"}
        }
