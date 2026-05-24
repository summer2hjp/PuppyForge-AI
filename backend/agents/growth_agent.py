from .base_agent import BaseAgent
from typing import Dict
from config import settings

class GrowthAgent(BaseAgent):
    def __init__(self):
        super().__init__("GrowthAgent")

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        prompt = f"""
        当前等级: {soul.level} | 经验: {soul.experience} 
        特质: {soul.traits.model_dump()}
        最近记忆: {[m.content[:100] for m in soul.memories[-3:]] if soul.memories else []}
        
        给出成长路径建议和下一阶段进化预测。
        """

        growth_plan = await self._call_llm(prompt)

        soul.experience += 25
        if soul.experience > soul.level * 120:
            soul.level += 1
            soul.evolution_stage = "rebel" if soul.level > 5 else "puppy"

        return {
            "agent": self.name,
            "growth_plan": growth_plan,
            "new_level": soul.level,
            "evolution_stage": soul.evolution_stage
        }
