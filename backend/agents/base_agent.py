from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential
from litellm import acompletion
import os

class BaseAgent(ABC):
    def __init__(self, name: str = "BaseAgent"):
        self.name = name
        self.llm_model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.fuel_consumption = 8.0  # 默认灵魂燃料消耗

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _call_llm(self, prompt: str, response_format: str = "json_object") -> Dict:
        response = await acompletion(
            model=self.llm_model,
            messages=[{"role": "system", "content": "You are a professional Puppy Soul Agent."},
                      {"role": "user", "content": prompt}],
            response_format={"type": response_format} if response_format == "json_object" else None,
            temperature=0.85,  # 高创造力
        )
        return response.choices[0].message.content

    @abstractmethod
    async def run(self, soul: Any, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """所有 Agent 必须实现的核心方法"""
        pass
