from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import json
import asyncio
from datetime import datetime
import redis.asyncio as redis
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Filter, FieldCondition, MatchValue
from openai import AsyncOpenAI
import os
import numpy as np

# 导入 Forge Pipeline（深度联动）
from backend.forge.pipeline import ForgePipeline

class InteractionEvent(BaseModel):
    puppy_id: str
    action: str
    context: str
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
    source: str = "user"
    visual_features: Optional[Dict[str, Any]] = None  # Vision Analyzer 扩展


class PersonaState(BaseModel):
    trust: float = Field(0.5, ge=0.0, le=1.0)
    neuroticism: float = Field(0.5, ge=0.0, le=1.0)
    energy: float = Field(0.7, ge=0.0, le=1.0)
    attachment: float = Field(0.8, ge=0.0, le=1.0)
    last_updated: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class TraitDrift(BaseModel):
    delta: Dict[str, float]
    reasoning: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class NeuromorphicEngine:
    """
    PuppyForge 神经形态引擎核心
    职责：事件摄入 → 双尺度记忆 → Trait Drift 计算 → Forge 个性化资产生成
    设计哲学：模拟生物神经可塑性，实现宠物数字灵魂的不可预测演化
    """

    def __init__(self):
        self.redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        self.qdrant = QdrantClient(host="localhost", port=6333)
        self.llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.collection_name = "puppy_memories"
        self.forge = ForgePipeline()  # 炼金联动

    async def process_interaction(self, event: InteractionEvent) -> str:
        """API 快速返回 + 异步神经演化"""
        event_id = f"evt_{int(datetime.utcnow().timestamp() * 1000)}"
        
        # 1. 事件溯源写入 Redis Stream
        await self.redis.xadd(
            f"puppy_events:{event.puppy_id}",
            {"data": event.model_dump_json()}
        )
        
        # 2. 异步触发完整闭环
        asyncio.create_task(self._persona_mutator_worker(event))
        
        return event_id

    async def _persona_mutator_worker(self, event: InteractionEvent):
        """核心 Worker：记忆存储 + 人格漂移 + Forge 干预"""
        # 1. 生成向量并存入 Qdrant（长期记忆）
        embedding = await self._generate_embedding(f"{event.action}: {event.context}")
        point = PointStruct(
            id=int(datetime.utcnow().timestamp() * 1000000),
            vector=embedding,
            payload={
                "puppy_id": event.puppy_id,
                "memory": event.context,
                "timestamp": event.timestamp,
                "source": event.source,
                "visual_features": event.visual_features
            }
        )
        self.qdrant.upsert(collection_name=self.collection_name, points=[point])

        # 2. 人格漂移 + Forge 联动
        await self._mutate_persona_with_forge(event)

    async def _generate_embedding(self, text: str) -> List[float]:
        """向量编码"""
        response = await self.llm.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding

    async def _mutate_persona_with_forge(self, event: InteractionEvent):
        """增强版人格演化 + Forge 闭环（核心创新点）"""
        # 1. 检索近期记忆
        memories = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=await self._generate_embedding("recent interactions"),
            limit=15,
            query_filter=Filter(
                must=[FieldCondition(key="puppy_id", match=MatchValue(value=event.puppy_id))]
            )
        )

        current = await self.get_persona(event.puppy_id)
        context = "\n".join([p.payload.get("memory", "") for p in memories])

        # 2. 计算 Trait Drift
        drift = await self._compute_trait_drift(current, context, event)

        # 3. Vision 视觉增强因子
        visual_boost = 1.18 if event.action == "vision_diagnosis" or event.visual_features else 1.0

        # 4. Forge 联动：生成个性化干预资产
        forge_context = {
            "persona": current.model_dump(),
            "event": event.model_dump(),
            "drift": drift.model_dump(),
            "visual_boost": visual_boost
        }
        forge_result = await self.forge.run_forge(
            puppy_id=event.puppy_id,
            base_prompt=f"基于性格漂移 {drift.reasoning} 生成针对 {event.action} 的个性化健康干预内容",
            context=forge_context
        )

        # 5. 融合 Forge 质量反馈调整漂移
        new_persona = current.model_copy()
        quality_boost = 1 + forge_result.get('final_quality', 0.0) * 0.3

        for trait, delta in drift.delta.items():
            if hasattr(new_persona, trait):
                current_val = getattr(new_persona, trait)
                new_val = current_val + delta * visual_boost * quality_boost
                setattr(new_persona, trait, max(0.0, min(1.0, new_val)))

        # 6. 更新实时人格态（Redis Hash）
        await self.redis.hset(
            f"puppy_persona:{event.puppy_id}",
            mapping=new_persona.model_dump()
        )

    async def _compute_trait_drift(self, current: PersonaState, context: str, event: InteractionEvent) -> TraitDrift:
        """LLM + 结构化输出计算性格漂移"""
        prompt = f"""你是一个精密的宠物神经形态性格演化引擎。
当前人格状态: {current.model_dump_json()}
近期记忆摘要: {context[-800:]}
当前事件: {event.action} - {event.context}

请严格以 JSON 输出 TraitDrift 对象，delta 范围控制在 -0.15 到 0.15 之间。"""

        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        return TraitDrift.model_validate(data)

    async def get_persona(self, puppy_id: str) -> PersonaState:
        """读取实时人格向量"""
        data = await self.redis.hgetall(f"puppy_persona:{puppy_id}")
        if not data:
            return PersonaState()
        return PersonaState.model_validate({k: float(v) for k, v in data.items()})
