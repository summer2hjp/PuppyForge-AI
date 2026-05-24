from .base_agent import BaseAgent
from typing import Dict

class PredictionAgent(BaseAgent):
    def __init__(self):
        super().__init__("PredictionAgent")

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        prompt = f"预测这只幼犬 {soul.name} 在接下来72小时内的行为趋势和健康风险。当前状态: {soul.traits.model_dump()}"

        prediction = await self._call_llm(prompt)

        return {
            "agent": self.name,
            "short_term_prediction": prediction,
            "confidence": 0.82
        }
