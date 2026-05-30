from .base_agent import BaseAgent
from typing import Dict, Any
from config import settings
from models import PuppySoul

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

    async def predict_drift(self, current_traits: Dict[str, float], recent_events: list) -> Dict[str, Any]:
        """预测特质漂移（供测试使用）"""
        # 根据事件计算漂移
        predicted_changes = {}
        for event in recent_events:
            if "exercise" in event.lower():
                predicted_changes["energy"] = predicted_changes.get("energy", 0) + 0.1
            elif "stress" in event.lower():
                predicted_changes["calmness"] = predicted_changes.get("calmness", 0) - 0.05
            elif "social" in event.lower():
                predicted_changes["loyalty"] = predicted_changes.get("loyalty", 0) + 0.05
        
        # 应用变化到当前特质
        predicted_traits = current_traits.copy()
        for trait, change in predicted_changes.items():
            if trait in predicted_traits:
                predicted_traits[trait] = max(0, min(1, predicted_traits[trait] + change))
        
        # 计算漂移幅度
        drift_magnitude = sum(abs(v) for v in predicted_changes.values())
        
        return {
            "predicted_traits": predicted_traits,
            "drift_magnitude": drift_magnitude,
            "predicted_changes": predicted_changes
        }
