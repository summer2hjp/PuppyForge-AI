from .base_agent import BaseAgent
from typing import Dict, Any

class DiagnosisAgent(BaseAgent):
    def __init__(self):
        super().__init__("DiagnosisAgent")

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        visual = input_data.get("visual_features", {})
        context = input_data.get("context", "")

        prompt = f"作为宠物健康诊断Agent，基于以下信息给出专业诊断：\n视觉特征: {visual}\n行为上下文: {context}"

        diagnosis_raw = await self._call_llm(prompt, response_format=None)

        return {
            "agent": self.name,
            "diagnosis": diagnosis_raw,
            "risk_level": 3 if "正常" in diagnosis_raw else 7,
            "visual_insights": visual
        }
