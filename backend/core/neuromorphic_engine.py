from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
import redis.asyncio as redis
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Filter, FieldCondition, MatchValue
from openai import AsyncOpenAI
import os

# 导入 Forge
from backend.forge.pipeline import ForgePipeline

class InteractionEvent(BaseModel):
    puppy_id: str
    action: str
    context: str
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
    source: str = "user"

class PersonaState(BaseModel):
    trust: float = Field(0.5, ge=0.0, le=1.0)
    neuroticism: float = Field(0.5, ge=0.0, le=1.0)
    energy: float = Field(0.7, ge=0.0, le=1.0)
    attachment: float = Field(0.8, ge=0.0, le=1.0)
    last_updated: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TraitDrift(BaseModel):
    delta: Dict[str, float]
    reasoning: str
    confidence: float

class NeuromorphicEngine:
    def __init__(self):
        self.redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        self.qdrant = QdrantClient(host="localhost", port=6333)
        self.llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.collection_name = "puppy_memories"
        self.forge = ForgePipeline()  # ← 关键联动注入

    async def process_interaction(self, event: InteractionEvent) -> str:
        """API 快速响应 + 异步演化"""
        event_id = f"evt_{int(datetime.utcnow().timestamp() * 1000)}"
        await self.redis.xadd(f"puppy_events:{event.puppy_id}", {"data": event.model_dump_json()})
        asyncio.create_task(self._persona_mutator_worker(event))
        return event_id

    async def _persona_mutator_worker(self, event: InteractionEvent):
        """记忆存储 + 联动 Forge"""
        # 1. 记忆入库
        embedding = await self._generate_embedding(f"{event.action}: {event.context}")
        point = PointStruct(
            id=int(datetime.utcnow().timestamp() * 1000000),
            vector=embedding,
            payload={"puppy_id": event.puppy_id, "memory": event.context, "timestamp": event.timestamp, "source": event.source}
        )
        self.qdrant.upsert(collection_name=self.collection_name, points=[point])

        # 2. 核心：人格漂移 + Forge 个性化资产生成
        await self._mutate_persona_with_forge(event.puppy_id, event)

    async def _generate_embedding(self, text: str) -> List[float]:
        response = await self.llm.embeddings.create(input=text, model="text-embedding-3-small")
        return response.data[0].embedding

    async def _mutate_persona_with_forge(self, puppy_id: str, event: InteractionEvent):
        """增强版漂移 + Forge 联动"""
        # 检索记忆
        memories = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=await self._generate_embedding("recent interactions"),
            limit=15,
            query_filter=Filter(must=[FieldCondition(key="puppy_id", match=MatchValue(value=puppy_id))])
        )

        current = await self.get_persona(puppy_id)
        context = "\n".join([p.payload.get("memory", "") for p in memories])

        # 计算基础漂移
        drift = await self._compute_trait_drift(current, context, event)

        # === Forge 联动：生成干预资产 ===
        forge_context = {
            "persona": current.model_dump(),
            "event": event.model_dump(),
            "drift": drift.model_dump()
        }
        forge_result = await self.forge.run_forge(
            puppy_id=puppy_id,
            base_prompt=f"基于性格漂移生成针对 {event.action} 的个性化健康干预内容",
            context=forge_context
        )

        # 融合 Forge 质量反馈调整漂移幅度
        new_persona = current.model_copy()
        quality_boost = 1 + forge_result.get('final_quality', 0.0)
        for trait, delta in drift.delta.items():
            if hasattr(new_persona, trait):
                val = getattr(new_persona, trait)
                setattr(new_persona, trait, max(0.0, min(1.0, val + delta * quality_boost)))

        await self.redis.hset(f"puppy_persona:{puppy_id}", mapping=new_persona.model_dump())

        return forge_result

    async def _compute_trait_drift(self, current: PersonaState, context: str, event: InteractionEvent) -> TraitDrift:
        prompt = f"""作为宠物性格演化引擎，根据以下信息计算 TraitDrift（JSON）：
当前人格: {current.model_dump_json()}
记忆: {context}
事件: {event.action} - {event.context}"""
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return TraitDrift.model_validate(data)

    async def get_persona(self, puppy_id: str) -> PersonaState:
        data = await self.redis.hgetall(f"puppy_persona:{puppy_id}")
        if not data:
            return PersonaState()
        return PersonaState.model_validate({k: float(v) for k, v in data.items() if v})
