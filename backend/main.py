from fastapi import FastAPI
from pydantic import BaseModel
from backend.core.neuromorphic_engine import NeuromorphicEngine, InteractionEvent
from backend.agents.orchestrator import SwarmOrchestrator
from backend.forge.pipeline import ForgePipeline
import uvicorn
from typing import Dict, Any

app = FastAPI(title="PuppyForge-AI", version="0.1.0")

# 全局实例
engine = NeuromorphicEngine()
orchestrator = SwarmOrchestrator()
forge = ForgePipeline()

@app.post("/api/v1/interact")
async def interact(event: InteractionEvent) -> Dict[str, Any]:
    """M1 核心闭环入口：互动 → 诊断 → 人格演化 → Forge 干预资产"""
    # 1. 神经形态处理（事件流 + 异步漂移 + Forge 联动）
    event_id = await engine.process_interaction(event)
    
    # 2. Swarm Agent 编排诊断
    swarm_result = await orchestrator.run(
        puppy_id=event.puppy_id,
        input_data={"action": event.action, "context": event.context}
    )
    
    # 3. 可选：直接触发 Forge 生成干预内容
    forge_prompt = f"生成针对 {event.action} 的个性化宠物健康干预方案"
    forge_result = await forge.run_forge(
        puppy_id=event.puppy_id,
        base_prompt=forge_prompt,
        context={"swarm": swarm_result.model_dump()}
    )
    
    return {
        "event_id": event_id,
        "status": "success",
        "health_score": swarm_result.health_score,
        "diagnosis": swarm_result.diagnosis,
        "recommendations": swarm_result.recommendations,
        "forge_asset": forge_result["asset"],
        "persona_update": "triggered"
    }

@app.get("/api/v1/puppy/{puppy_id}/persona")
async def get_persona(puppy_id: str):
    """读取实时人格态"""
    persona = await engine.get_persona(puppy_id)
    return persona.model_dump()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
