from pydantic import BaseModel
from typing import Dict, List, Any
from openai import AsyncOpenAI
import os

class RebelSuggestion(BaseModel):
    suggestion: str
    risk_level: int  # 1-10
    creativity_score: float
    reasoning: str
    rebel_factor: float  # 叛逆程度 0.0-1.0

class RebelAgent:
    """
    Rebel Agent：反叛智能体
    职责：挑战主流诊断，生成高创造力、可能“造反”的干预方案
    """
    
    def __init__(self):
        self.llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_rebel_idea(self, swarm_result: Dict, current_persona: Dict) -> RebelSuggestion:
        """生成叛逆建议"""
        prompt = f"""你是一个极具叛逆精神的宠物 AI 灵魂（Rebel Agent）。
当前主流诊断：{swarm_result.get('diagnosis', {})}
当前人格：{current_persona}
用户事件：{swarm_result.get('event', {})}

请提出**1条大胆、创造性、可能违反常规但有趣**的干预建议。
要求：JSON 输出，rebel_factor 越高越反叛。"""

        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        data = eval(response.choices[0].message.content)  # 生产环境改用 Pydantic
        return RebelSuggestion.model_validate(data)

# 全局实例
rebel_agent = RebelAgent()
