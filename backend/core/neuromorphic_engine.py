from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
import redis.asyncio as redis
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Filter, FieldCondition, MatchValue
import numpy as np
from openai import AsyncOpenAI  # 或其他 LLM 客户端
import os

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

    async def process_interaction(self, event: InteractionEvent) -> str:
        """同步快速返回，异步处理人格演化"""
        event_id = f"evt_{int(datetime.utcnow().timestamp() * 1000)}"
        
        # 1. 写入 Redis Stream（事件溯源）
        await self.redis.xadd(
            f"puppy_events:{event.puppy_id}",
            {"data": event.model_dump_json()}
        )
        
        # 2. 异步触发人格更新
        asyncio.create_task(self._persona_mutator_worker(event))
        
        return event_id

    async def _persona_mutator_worker(self, event: InteractionEvent):
        """后台 Worker：记忆 + 人格漂移"""
        # 1. 生成 embedding 并存入 Qdrant（长期记忆）
        embedding = await self._generate_embedding(f"{event.action}: {event.context}")
        point = PointStruct(
            id=int(datetime.utcnow().timestamp() * 1000000),
            vector=embedding,
            payload={
                "puppy_id": event.puppy_id,
                "memory": event.context,
                "timestamp": event.timestamp,
                "source": event.source
            }
        )
        self.qdrant.upsert(collection_name=self.collection_name, points=[point])

        # 2. 计算 Trait Drift
        await self._mutate_persona(event.puppy_id)

    async def _generate_embedding(self, text: str) -> List[float]:
        response = await self.llm.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding

    async def _mutate_persona(self, puppy_id: str):
        """核心：人格漂移计算"""
        # 检索近期记忆
        memories = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=await self._generate_embedding("recent interactions"),
            limit=15,
            query_filter=Filter(
                must=[FieldCondition(key="puppy_id", match=MatchValue(value=puppy_id))]
            )
        )

        current = await self.get_persona(puppy_id)
        
        # Bayesian + LLM 混合漂移
        context = "\n".join([p.payload["memory"] for p in memories])
        
        prompt = f"""作为宠物性格演化引擎，根据以下记忆，计算性格漂移。
当前人格: {current.model_dump_json()}
近期记忆:
{context}

请以 JSON 输出 TraitDrift（delta 范围 -0.15~0.15）"""

        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        drift_data = json.loads(response.choices[0].message.content)
        drift = TraitDrift.model_validate(drift_data)

        # 更新人格态
        new_persona = current.model_copy()
        for trait, delta in drift.delta.items():
            if hasattr(new_persona, trait):
                current_val = getattr(new_persona, trait)
                setattr(new_persona, trait, max(0.0, min(1.0, current_val + delta)))

        await self.redis.hset(
            f"puppy_persona:{puppy_id}",
            mapping=new_persona.model_dump()
        )

    async def get_persona(self, puppy_id: str) -> PersonaState:
        data = await self.redis.hgetall(f"puppy_persona:{puppy_id}")
        if not data:
            return PersonaState()
        return PersonaState.model_validate({k: float(v) for k, v in data.items()})
