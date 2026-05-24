from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uvicorn
from contextlib import asynccontextmanager

from orchestrator import SoulOrchestrator
from models import InteractionResult

# 全局编排器
orchestrator = SoulOrchestrator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🐾 PuppyForge AI Soul Engine 启动中...")
    # 初始化数据库 & Qdrant
    yield
    print("👋 PuppyForge 已优雅关闭")

app = FastAPI(title="PuppyForge-AI", lifespan=lifespan)

# CORS - 生产环境建议严格限制
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://puppyforge.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "PuppyForge Soul Engine v3.0 在线",
        "version": "3.0.0"
    }

@app.post("/api/interact/{soul_id}")
async def interact(soul_id: str, payload: dict):
    """主交互接口"""
    result: InteractionResult = await orchestrator.interact(
        soul_id=soul_id,
        user_input=payload.get("user_input"),
        visual_features=payload.get("visual_features"),
        context=payload.get("context")
    )
    return result.model_dump()

# ==================== WebSocket 实时灵魂通道 ====================
@app.websocket("/ws/soul/{soul_id}")
async def soul_websocket(websocket: WebSocket, soul_id: str):
    await websocket.accept()
    print(f"🔗 Soul {soul_id} 已连接")

    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()
            
            if data.get("type") == "interact":
                result = await orchestrator.interact(
                    soul_id=soul_id,
                    user_input=data["payload"]["user_input"]
                )
                
                await websocket.send_json({
                    "type": "soul_update",
                    "soul": result.soul.model_dump(),
                    "response": result.response,
                    "agent_insights": result.agent_insights
                })

            # 主动推送状态
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        print(f"❌ Soul {soul_id} 已断开")
    except Exception as e:
        print(f"WebSocket Error: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
