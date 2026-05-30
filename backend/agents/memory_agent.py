from .base_agent import BaseAgent
from typing import Dict, Any
import hashlib


class MemoryAgent(BaseAgent):
    """记忆 Agent - 存储和检索宠物记忆"""
    
    def __init__(self):
        super().__init__("MemoryAgent")
        self.fuel_consumption = 5.0
    
    async def store_memory(
        self, 
        pet_id: str, 
        event: str, 
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        存储记忆并生成嵌入
        
        Args:
            pet_id: 宠物 ID
            event: 事件描述
            context: 上下文信息
            
        Returns:
            包含 pet_id 和 embedding 的字典
        """
        # 生成简单的基于内容的嵌入（模拟）
        content = f"{pet_id}:{event}:{context}"
        embedding_hash = hashlib.sha256(content.encode()).hexdigest()
        embedding = [int(embedding_hash[i:i+2], 16) / 255.0 for i in range(0, len(embedding_hash), 2)]
        
        return {
            "pet_id": pet_id,
            "event": event,
            "context": context or {},
            "embedding": embedding,
            "agent": self.name
        }
    
    async def run(self, soul: Any, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """实现 BaseAgent 的抽象方法"""
        pet_id = input_data.get("pet_id", "")
        event = input_data.get("event", "")
        context = input_data.get("context", {})
        return await self.store_memory(pet_id, event, context)
