from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime

import os
from openai import AsyncOpenAI
from qdrant_client import QdrantClient

class ForgeStage(BaseModel):
    stage_name: str
    input_data: Dict[str, Any]
    output: Optional[Dict[str, Any]] = None
    quality_score: float = 0.0

class ForgePipeline:
    def __init__(self):
        self.llm = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.qdrant = QdrantClient(host='localhost', port=6333)
        self.collection_name = 'forged_assets'

    async def run_forge(self, puppy_id: str, base_prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        '''四阶段炼金流水线：Alchemy → Parallel Forging → Adversarial Validation → Crystallize'''
        stages = []

        # 1. Prompt 炼金 (Alchemy Prompt)
        alchemy_result = await self._alchemy_prompt(base_prompt, context)
        stages.append(ForgeStage(stage_name='alchemy', input_data={'prompt': base_prompt}, output=alchemy_result))

        # 2. 并行锻造 (Parallel Forging)
        forged = await self._parallel_forging(alchemy_result['refined_prompt'], context)
        stages.append(ForgeStage(stage_name='forging', input_data=alchemy_result, output=forged))

        # 3. 对抗质检 (Adversarial Validation)
        validated = await self._adversarial_validation(forged)
        stages.append(ForgeStage(stage_name='validation', input_data=forged, output=validated))

        # 4. 资产结晶 (Crystallize Asset)
        asset = await self._crystallize_asset(puppy_id, validated)
        stages.append(ForgeStage(stage_name='crystallize', input_data=validated, output=asset))

        return {
            'puppy_id': puppy_id,
            'asset': asset,
            'stages': [s.model_dump() for s in stages],
            'final_quality': asset.get('quality_score', 0.0)
        }

    async def _alchemy_prompt(self, base_prompt: str, context: Dict) -> Dict:
        '''Prompt 进化炼金'''
        prompt = f"""作为高级提示炼金师，优化以下基础提示用于宠物内容生成。
基础提示: {base_prompt}
上下文: {context}

输出优化后的提示和关键变体。"""
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return {'refined_prompt': response.choices[0].message.content, 'variants': []}

    async def _parallel_forging(self, refined_prompt: str, context: Dict) -> Dict:
        '''并行多模型锻造 (模拟)'''
        # 实际可扩展到多个 LLM 调用
        result = {
            'content': f'锻造内容: {refined_prompt[:200]}...',
            'variants': ['variant1', 'variant2'],
            'creativity_score': 0.92
        }
        return result

    async def _adversarial_validation(self, forged: Dict) -> Dict:
        '''对抗质检'''
        prompt = f"""作为对抗审查 Agent，严格评估以下内容质量、宠物相关性和安全性。
内容: {forged}

输出 JSON: score, issues, approved"""
        response = await self.llm.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = eval(response.choices[0].message.content)  # 生产环境用 json.loads
        return {**forged, **data}

    async def _crystallize_asset(self, puppy_id: str, validated: Dict) -> Dict:
        '''资产结晶 + 向量存储'''
        embedding = await self._generate_embedding(validated['content'])
        point_id = int(datetime.utcnow().timestamp() * 1000000)
        self.qdrant.upsert(
            collection_name=self.collection_name,
            points=[{
                'id': point_id,
                'vector': embedding,
                'payload': {
                    'puppy_id': puppy_id,
                    'asset_type': 'forged_content',
                    'content': validated['content'],
                    'timestamp': datetime.utcnow().isoformat(),
                    'quality': validated.get('score', 0.0)
                }
            }]
        )
        return {
            'asset_id': str(point_id),
            'quality_score': validated.get('score', 0.85),
            'url': f'/assets/{puppy_id}/{point_id}',
            'status': 'crystallized'
        }

    async def _generate_embedding(self, text: str) -> List[float]:
        response = await self.llm.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
