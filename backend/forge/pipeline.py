import asyncio
from dataclasses import dataclass
from temporalio import workflow, activity
from temporalio.common import RetryPolicy

@dataclass
class ForgeInput:
    user_id: str
    raw_prompt: str
    asset_type: str  # "puppy", "gear", "habitat"

# --- 1. 炼金活动：Prompt 优化 ---
@activity.defn
async def alchemy_prompt(raw_prompt: str, asset_type: str) -> dict:
    # 调用 LLM 将 "一只赛博朋克的狗" 转为包含权重、负向提示词的 JSON
    # return await llm_client.optimize(raw_prompt, asset_type)
    return {"positive": "cyberpunk dog, neon, 8k", "negative": "blurry, lowres", "seeds": [42, 88, 1024]}

# --- 2. 锻造活动：多模型并行生成 ---
@activity.defn
async def parallel_forging(prompts: dict) -> list[str]:
    # 并发调用 Flux/SD3 生成候选图片/3D模型
    tasks = [generate_asset(prompts["positive"], prompts["negative"], seed) for seed in prompts["seeds"]]
    return await asyncio.gather(*tasks)

async def generate_asset(pos, neg, seed) -> str:
    # Mock: 调用生图 API
    return f"s3://forge-temp/candidate_{seed}.webp"

# --- 3. 质检活动：VLM 对抗校验 ---
@activity.defn
async def adversarial_validation(candidates: list[str], original_prompt: str) -> str:
    # 引入 VLM (如 LLaVA/Qwen-VL) 对候选资产进行严苛打分
    # 选出最符合 prompt 且没有结构崩坏 (如 5 条腿) 的资产
    # winner = await vlm_client.judge(candidates, original_prompt)
    return candidates[0] # Mock: 返回胜者

# --- 4. 结晶活动：资产后处理与入库 ---
@activity.defn
async def crystallize_asset(winner_url: str, user_id: str) -> str:
    # 1. 图像转 3D (如 Tripo3D / LRM) 
    # 2. 生成 LOD 和压缩纹理
    # 3. 写入 PostgreSQL 资产表 & 向量库
    return f"s3://puppyforge-assets/{user_id}/final_asset.glb"

# --- 核心状态机编排 ---
@workflow.defn
class PuppyForgePipeline:
    @workflow.run
    async def run(self, input: ForgeInput) -> str:
        # 阶段 1: 炼金
        prompts = await workflow.execute_activity(
            alchemy_prompt, args=[input.raw_prompt, input.asset_type],
            start_to_close_timeout=10, retry_policy=RetryPolicy(maximum_attempts=3)
        )
        
        # 阶段 2: 并行锻造
        candidates = await workflow.execute_activity(
            parallel_forging, args=[prompts],
            start_to_close_timeout=120, heartbeat_timeout=30
        )
        
        # 阶段 3: 对抗校验
        winner = await workflow.execute_activity(
            adversarial_validation, args=[candidates, input.raw_prompt],
            start_to_close_timeout=30
        )
        
        # 阶段 4: 结晶
        final_asset_url = await workflow.execute_activity(
            crystallize_asset, args=[winner, input.user_id],
            start_to_close_timeout=300
        )
        
        return final_asset_url
