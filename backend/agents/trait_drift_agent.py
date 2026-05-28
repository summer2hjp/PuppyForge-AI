from .base_agent import BaseAgent
from typing import Dict, Any
from backend.config import settings
from backend.models import PuppySoul

class TraitDriftAgent(BaseAgent):
    def __init__(self):
        super().__init__("TraitDriftAgent")
        self.fuel_consumption = 12.0

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        user_input = input_data.get("user_input", "")
        current_traits = soul.traits.model_dump()

        prompt = f"""
        当前幼犬灵魂状态：
        名字: {soul.name} | 等级: {soul.level} | 叛逆值: {soul.rebellion_score}
        当前特质: {current_traits}
        用户行为: {user_input}

        请输出 JSON 格式的性格漂移变化（允许正负），重点考虑 chaos、curiosity、rebellion。
        """

        result = await self._call_llm(prompt)
        drift_changes = eval(result) if isinstance(result, str) else result

        soul.apply_drift(drift_changes)
        soul.soul_fuel = max(10.0, soul.soul_fuel - self.fuel_consumption)

        return {
            "agent": self.name,
            "drift_applied": drift_changes,
            "new_traits": soul.traits.model_dump(),
            "fuel_consumed": self.fuel_consumption
        }
