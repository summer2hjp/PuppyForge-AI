from fastapi import FastAPI
from pydantic import BaseModel
from backend.core.neuromorphic_engine import NeuromorphicEngine, InteractionEvent
from backend.agents.orchestrator import SwarmOrchestrator
from backend.forge.pipeline import ForgePipeline
from backend.observability.neural_probes import NeuralProbes, tracer
import uvicorn
from typing import Dict, Any

app = FastAPI(
    title="PuppyForge-AI",
    version="0.2.0",
    description="神经形态宠物数字灵魂锻造平台 - 诊断→预测→干预→记忆演化闭环"
)

# M2 可观测性初始化
probes = NeuralProbes()
probes.setup_instrumentation(app)

# 全局核心引擎实例（单例模式）
engine = NeuromorphicEngine()
orchestrator = SwarmOrchestrator()
forge = ForgePipeline()

@app.post("/api/v1/interact")
async def interact(event: InteractionEvent) -> Dict[str, Any]:
    """全栈 M1+M2 统一入口 - 带完整可观测性"""
    with tracer.start_as_current_span("api.interact") as span:
        span.set_attribute("puppy_id", event.puppy_id)
        span.set_attribute("action", event.action)
        span.set_attribute("has_vision", bool(event.visual_features))

        # 1. 神经形态引擎处理（事件流 + 异步人格演化 + Forge 联动）
        event_id = await engine.process_interaction(event)

        # 2. Swarm Agent 编排诊断
        swarm_result = await orchestrator.run(
            puppy_id=event.puppy_id,
            input_data=event.model_dump()
        )

        # 3. Forge 炼金生成个性化干预资产
        forge_result = await forge.run_forge(
            puppy_id=event.puppy_id,
            base_prompt=f"基于 {event.action} 和视觉特征生成高品质健康干预内容",
            context={
                "swarm": swarm_result.model_dump(),
                "event": event.model_dump()
            }
        )

        # 4. 记录可观测性探针
        await probes.record_persona_drift(
            event.puppy_id,
            {"delta": {}},  # 实际由 engine 内部计算
            forge_result.get("final_quality", 0.0)
        )

        return {
            "event_id": event_id,
            "status": "success",
            "health_score": swarm_result.health_score,
            "diagnosis": swarm_result.diagnosis,
            "recommendations": swarm_result.recommendations,
            "forge_asset": forge_result.get("asset"),
            "persona_update": "triggered",
            "observability": "fully_tracked"
        }


@app.get("/api/v1/puppy/{puppy_id}/persona")
async def get_persona(puppy_id: str):
    """读取实时人格态"""
    persona = await engine.get_persona(puppy_id)
    return persona.model_dump()


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "
