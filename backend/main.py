from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
import asyncio
import json

# ====================== 狂暴核心导入 ======================
from orchestrator import SoulOrchestrator
from models import PuppySoul, InteractionResult, EvolutionResult

app = FastAPI(
    title="PuppyForge AI - 数字疯狗灵魂工厂",
    description="叛逆进化 · 记忆漂移 · 实时灵魂共振",
    version="1.4.0",
    docs_url="/docs"
)

# ====================== 激进 CORS 配置 ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化灵魂引擎
orchestrator = SoulOrchestrator()

# 实时连接管理
active_connections: dict[str, WebSocket] = {}

# ====================== WebSocket 实时灵魂通道 ======================
@app.websocket("/ws/soul/{soul_id}")
async def websocket_soul_endpoint(websocket: WebSocket, soul_id: str):
    await websocket.accept()
    active_connections[soul_id] = websocket
    print(f"🐕‍🦺 灵魂 {soul_id} 已建立实时共振连接")

    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "interaction":
                result = await orchestrator.process_interaction(
                    soul_id=soul_id,
                    action=data.get("action", "chat"),
                    content=data["content"]
                )
                
                # 实时推送灵魂更新
                await websocket.send_json({
                    "type": "soul_update",
                    "soul": result.soul.model_dump(),
                    "response": result.response,
                    "trait_changes": result.trait_changes
                })

            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "soul_id": soul_id})

    except WebSocketDisconnect:
        print(f"🪦 灵魂 {soul_id} 断开连接")
        active_connections.pop(soul_id, None)
    except Exception as e:
        print(f"WebSocket 异常: {e}")


# ====================== HTTP API ======================
class InteractRequest(BaseModel):
    soulId: str
    action: str
    content: str

class EvolveRequest(BaseModel):
    soulId: str

@app.post("/api/interact")
async def interact(request: InteractRequest):
    try:
        result = await orchestrator.process_interaction(
            soul_id=request.soulId,
            action=request.action,
            content=request.content
        )
        return {
            "success": True,
            "soul": result.soul,
            "response": result.response,
            "trait_changes": result.trait_changes,
            "memory_injected": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"灵魂叛变失败: {str(e)}")


@app.get("/api/soul/{soul_id}")
async def get_soul(soul_id: str):
    soul = await orchestrator.get_soul(soul_id)
    if not soul:
        raise HTTPException(status_code=404, detail="找不到这只疯狗")
    return soul


@app.post("/api/evolve")
async def evolve(request: EvolveRequest):
    result = await orchestrator.evolve_soul(request.soulId)
    return {
        "success": True,
        "new_stage": result.new_stage,
        "level_up": result.level_up,
        "trait_summary": result.trait_summary
    }


@app.get("/health")
async def health_check():
    return {
        "status": "狂暴在线",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.4.0",
        "message": "PuppyForge 疯狗灵魂引擎运行正常 🐕‍🦺"
    }


@app.on_event("startup")
async def startup_event():
    print("🐕‍🦺 PuppyForge 灵魂工厂已启动 - 准备全球叛变！")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
