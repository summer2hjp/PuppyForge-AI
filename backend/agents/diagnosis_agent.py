from pydantic import BaseModel
from typing import Dict, List

class DiagnosisResult(BaseModel):
    condition: str
    confidence: float
    risk_level: int  # 1-10
    suggestions: List[str]
    explanation: str

class DiagnosisAgent:
    async def analyze(self, input_data: Dict) -> Dict:
        # 这里后续接入真实 LLM 或 Vision 模型
        # 当前返回结构化模拟结果
        return {
            "condition": "轻度皮肤敏感",
            "confidence": 0.87,
            "risk_level": 3,
            "suggestions": [
                "增加 omega-3 摄入",
                "观察 48 小时",
                "保持皮肤干燥清洁"
            ],
            "explanation": "基于图片和描述的初步视觉诊断。"
        }
