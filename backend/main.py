from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import logging
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from orchestrator import SoulOrchestrator
from models import ErrorResponse

# ==================== 日志 & 限流 ====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("puppyforge")

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🐾 PuppyForge AI Soul Engine v4.0 启动")
    yield
    logger.info("👋 PuppyForge 已安全关闭")

app = FastAPI(title="PuppyForge-AI", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==================== 安全中间件 ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"],
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未捕获异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(message="内部灵魂引擎异常", detail=str(exc)).model_dump()
    )

# ==================== 依赖注入 ====================
orchestrator = SoulOrchestrator()

def get_orchestrator():
    return orchestrator

# ==================== 路由 ====================
@app.get("/")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MIN}/minute")
async def root():
    return {"status": "running", "version": "4.0.0", "message": "Puppy Soul Engine 安全运行中"}

@app.post("/api/interact/{soul_id}")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MIN}/minute")
async def interact(soul_id: str, payload: dict, orch=Depends(get_orchestrator)):
    try:
        result = await orch.interact(
            soul_id=soul_id,
            user_input=payload.get("user_input", ""),
            visual_features=payload.get("visual_features"),
            context=payload.get("context")
        )
        return result.model_dump()
    except Exception as e:
        logger.error(f"Interaction failed: {e}")
        raise

# ==================== WebSocket 安全通道 ====================
@app.websocket("/ws/soul/{soul_id}")
async def soul_websocket(websocket: WebSocket, soul_id: str, orch=Depends(get_orchestrator)):
    await websocket.accept()
    logger.info(f"🔗 Secure Soul {soul_id} connected")

    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "interact":
                result = await orch.interact(
                    soul_id=soul_id,
                    user_input=data["payload"].get("user_input", "")
                )
                
                await websocket.send_json({
                    "type": "soul_update",
                    "soul": result.soul.model_dump(),
                    "response": result.response,
                    "agent_insights": result.agent_insights
                })
            
            await asyncio.sleep(1.2)  # 性能优化间隔

    except WebSocketDisconnect:
        logger.info(f"❌ Soul {soul_id} disconnected")
    except Exception as e:
        logger.error(f"WS Error: {e}")
        await websocket.close(code=1011)
