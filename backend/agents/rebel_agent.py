from .base_agent import BaseAgent
from pydantic import BaseModel
from typing import Dict

class RebelSuggestion(BaseModel):
    suggestion: str
    risk_level: int
    creativity_score: float
    reasoning: str
    rebel_factor: float

class RebelAgent(BaseAgent):
    def __init__(self):
        super().__init__("RebelAgent")
        self.fuel_consumption = 15.0  # 叛逆消耗更高

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        swarm_result = input_data.get("swarm_result", {})
        current_persona = soul.traits.model_dump()

        prompt = f"""你是极度叛逆的 Puppy Rebel Agent。
当前灵魂: {soul.name} (叛逆度: {soul.rebellion_score})
主流诊断: {swarm_result.get('diagnosis')}
用户输入: {input_data.get('user_input')}

生成**1条极其大胆、有趣、可能违反常规**的建议。"""

        result = await self._call_llm(prompt)
        suggestion = RebelSuggestion.model_validate(eval(result) if isinstance(result, str) else result)

        soul.rebellion_score += suggestion.rebel_factor * 20

        return {
            "agent": self.name,
            "rebel_suggestion": suggestion.model_dump(),
            "rebellion_boost": suggestion.rebel_factor * 20
        }
