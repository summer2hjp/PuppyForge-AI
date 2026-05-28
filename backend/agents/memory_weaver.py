from .base_agent import BaseAgent
from typing import Dict, Any
from backend.models import PetMemory
from backend.models import PuppySoul
from backend.config import settings
from datetime import datetime
import uuid

class MemoryWeaver(BaseAgent):
    def __init__(self):
        super().__init__("MemoryWeaver")
        self.fuel_consumption = 6.0

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        user_input = input_data.get("user_input", "")

        prompt = f"基于以下交互，为幼犬 {soul.name} 编织一段深刻且富有情感的记忆：{user_input}"

        memory_content = await self._call_llm(prompt, response_format=None)

        new_memory = PetMemory(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            type="interaction",
            content=memory_content[:500],
            impact=0.75,
            mood_delta=8.0,
            source_agent=self.name
        )

        soul.memories.append(new_memory)
        if len(soul.memories) > settings.MAX_MEMORIES_PER_SOUL:
            soul.memories.pop(0)

        return {
            "agent": self.name,
            "memory": new_memory.model_dump(),
            "total_memories": len(soul.memories)
        }
