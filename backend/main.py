from fastapi import FastAPI
from pydantic import BaseModel
from backend.core.neuromorphic_engine import NeuromorphicEngine, InteractionEvent
from backend.agents.orchestrator import SwarmOrchestrator
from backend.forge.pipeline import ForgePipeline
from backend.observability.neural_probes import NeuralProbes, tracer
import uvicorn
from typing import Dict, Any

app = FastAPI(title="PuppyForge-AI", version="0.2.0")

# M2 可观测性初始化
probes = NeuralProbes()
probes.setup_instrumentation(app)

# 核心引擎实例
engine = NeuromorphicEngine()
orchestrator = SwarmOrchestrator()
forge = ForgePipeline()

@app.post("/api/v1/interact")
async def interact(event: InteractionEvent) -> Dict[str, Any]:
    """M1+M2 全闭环：带完整可观测性"""
    with tracer.start_as_current_span("api.interact") as span:
        span.set_attribute("puppy_id", event.puppy_id)
        span.set_attribute("action", event.action)

        # 神经形态处理
        event_id = await engine.process_interaction(event)
        
        # Agent 编排
        swarm_result = await orchestrator.run(
            puppy_id=event.puppy_id, 
            input_data=event.model_dump()
        )
        
        # Forge 炼金
        forge_result = await forge.run_forge(
            puppy_id=event.puppy_id,
            base_prompt=f"基于 {event.action} 生成个性化干预",
            context={"swarm": swarm_result.model_dump()}
        )
        
        # M2 探针记录
        await probes.record_persona_drift(
            event.puppy_id, 
            {"delta": {}}, 
            forge_result.get("final_quality", 0.0)
        )
        
        return {
            "event_id": event_id,
            "health_score": swarm_result.health_score,
            "diagnosis": swarm_result.diagnosis,
            "forge_asset": forge_result["asset"],
            "observability": "tracked"
        }

@app.get("/api/v1/puppy/{puppy_id}/persona")
async def get_persona(puppy_id: str):
    return (await engine.get_persona(puppy_id)).model_dump()

@app.get("/health")
async def health():
    return {"status": "healthy", "observability": "active"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
