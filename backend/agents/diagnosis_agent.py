from .base_agent import BaseAgent
from typing import Dict, Any
from config import settings
from models import PuppySoul

class DiagnosisAgent(BaseAgent):
    def __init__(self):
        super().__init__("DiagnosisAgent")

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        visual = input_data.get("visual_features", {})
        context = input_data.get("context", "")

        prompt = f"作为专业宠物健康诊断Agent，基于以下信息给出详细诊断：\n视觉特征: {visual}\n行为上下文: {context}"

        diagnosis_raw = await self._call_llm(prompt, response_format=None)

        risk_level = 7 if any(word in diagnosis_raw.lower() for word in ["异常", "危险", "问题"]) else 3

        return {
            "agent": self.name,
            "diagnosis": diagnosis_raw,
            "risk_level": risk_level,
            "visual_insights": visual
        }
