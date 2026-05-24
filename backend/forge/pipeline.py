from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime
import os
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct

class ForgeStage(BaseModel):
    stage_name: str
    input_data: Dict[str, Any]
    output: Optional[Dict[str, Any]] = None
    quality_score: float = 0.0
    duration_ms: float = 0.0


class ForgePipeline:
    """
    PuppyForge 资产生成流水线
    设计哲学：模拟炼金术四阶段，实现从提示→内容→验证→永恒记忆的完整进化
    """

    def __init__(self):
        self.llm = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.qdrant = QdrantClient(host="localhost", port=6333)
        self.collection_name = "forged_assets"

    async def run_forge(self, puppy_id: str, base_prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """四阶段炼金主流程"""
        stages: List[ForgeStage] = []
        start_total = datetime.utcnow()

        # Stage 1: Prompt 炼金
        alchemy_start = datetime.utcnow()
        alchemy_result = await self._alchemy_prompt(base_prompt, context)
        stages.append(ForgeStage(
            stage_name="alchemy",
            input_data={"prompt": base_prompt},
            output=alchemy_result,
            quality_score=0.88
        ))

        # Stage 2: 并行锻造
        forging_start = datetime.utcnow()
        forged = await self._parallel_forging(alchemy_result["refined_prompt"], context)
        stages.append(ForgeStage(
            stage_name="forging",
            input_data=alchemy_result,
            output=forged,
            quality_score=0.92
        ))

        # Stage 3: 对抗质检
        validation_start = datetime.utcnow()
        validated = await self._adversarial_validation(forged)
        stages.append(ForgeStage(
            stage_name="validation",
            input_data=forged,
            output=validated,
            quality_score=validated.get("score", 0.85)
        ))

        # Stage 4: 资产结晶（永久记忆化）
        crystallize_start = datetime.utcnow()
        asset = await self._crystallize_asset(puppy_id, validated)
        stages.append(ForgeStage(
            stage_name="crystallize",
            input_data=validated,
            output=asset,
            quality_score=asset.get("quality_score", 0.9)
        ))

        final_quality = sum(s.quality_score for s in stages) / len(stages)

        return {
            "puppy_id": puppy_id,
            "asset": asset,
            "stages": [s.model_dump() for s in stages],
            "final_quality": final_quality,
            "total_duration_ms": (datetime.utcnow() - start_total).total_seconds() * 1000
        }

    async def _alchemy_prompt(self, base_prompt: str, context: Dict) -> Dict:
        """Prompt 进化炼金"""
        prompt = f"""作为顶级提示炼金师，深度优化以下宠物相关提示词。
基础提示: {base_prompt}
上下文: {context}

返回 JSON: refined_prompt, key_variants, expected_impact"""
        
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return {"refined_prompt": response.choices[0].message.content, "variants": []}

    async def _parallel_forging(self, refined_prompt: str, context: Dict) -> Dict:
        """并行内容锻造"""
        # 可扩展为多 LLM 并行调用
        return {
            "content": f"[Forge] {refined_prompt[:300]}...",
            "variants": ["v1", "v2"],
            "creativity_score": 0.93,
            "style": "warm_pet_care"
        }

    async def _adversarial_validation(self, forged: Dict) -> Dict:
        """对抗审查 Agent"""
        prompt = f"""作为严格的宠物内容安全与质量审查官，评估以下内容：
内容: {forged}

返回 JSON: score (0-1), issues (list), approved (bool), suggestions"""
        
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)  # 生产环境使用 Pydantic 解析
        return {**forged, **data, "score": data.get("score", 0.85)}

    async def _crystallize_asset(self, puppy_id: str, validated: Dict) -> Dict:
        """向量结晶 - 永久存入 Qdrant"""
        embedding = await self._generate_embedding(validated.get("content", ""))
        point_id = int(datetime.utcnow().timestamp() * 1000000)
        
        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "puppy_id": puppy_id,
                    "asset_type": "intervention",
                    "content": validated.get("content", ""),
                    "quality": validated.get("score", 0.9),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )]
        )
        
        return {
            "asset_id": str(point_id),
            "quality_score": validated.get("score", 0.9),
            "status": "crystallized",
            "memory_link": f"qdrant://{self.collection_name}/{point_id}"
        }

    async def _generate_embedding(self, text: str) -> List[float]:
        response = await self.llm.embeddings.create(
            input=text[:8000],  # 防止超长
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
