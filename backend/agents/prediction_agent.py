from .base_agent import BaseAgent
from typing import Dict
from config import settings

class PredictionAgent(BaseAgent):
    def __init__(self):
        super().__init__("PredictionAgent")

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        prompt = f"预测幼犬 {soul.name} 在接下来72小时内的行为趋势、健康风险和可能叛逆事件。当前状态: {soul.traits.model_dump()}"

        prediction = await self._call_llm(prompt)

        return {
            "agent": self.name,
            "short_term_prediction": prediction,
            "confidence": 0.82
        }
