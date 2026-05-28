from abc import ABC, abstractmethod
from typing import Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
from litellm import acompletion

from config import settings

class BaseAgent(ABC):
    def __init__(self, name: str = "BaseAgent"):
        self.name = name
        self.llm_model = settings.LLM_MODEL
        self.temperature = settings.LLM_TEMPERATURE
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.fuel_consumption = 8.0

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _call_llm(self, prompt: str, response_format: str = "json_object") -> Dict:
        response = await acompletion(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": "You are a professional, creative Puppy Soul Agent."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        return response.choices[0].message.content

    @abstractmethod
    async def run(self, soul: Any, input_data: Dict[str, Any]) -> Dict[str, Any]:
        pass
