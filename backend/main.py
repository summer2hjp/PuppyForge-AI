from fastapi import FastAPI, Depends, HTTPException, Request
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
from auth import router as auth_router, get_current_user
from models.auth import User
from orchestrator import SoulOrchestrator
from models import ErrorResponse, InteractionResult

# ==================== 日志 & 全局配置 ====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("puppyforge")

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🐾 PuppyForge AI Soul Engine v4.1 已启动 | Auth + Security 已就绪")
    yield
    logger.info("👋 PuppyForge 已安全关闭")

app = FastAPI(title="PuppyForge-AI", version="4.1", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==================== 安全中间件 ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-*"],
)

# ==================== 全局异常处理器 ====================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未捕获异常: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            message="灵魂引擎内部异常", 
            detail="请稍后重试或联系管理员"
        ).model_dump()
    )

# ==================== 依赖注入 ====================
orchestrator = SoulOrchestrator()

def get_orchestrator():
    return orchestrator

# ==================== 路由注册 ====================
app.include_router(auth_router)

# ==================== 健康检查 ====================
@app.get("/")
@limiter.limit("60/minute")
async def root():
    return {
        "status": "running",
        "version": "4.1.0",
        "message": "PuppyForge Soul Engine + Auth System 在线",
        "auth": "enabled"
    }

# ==================== 受保护的灵魂交互接口 ====================
@app.post("/api/interact/{soul_id}", response_model=InteractionResult)
@limiter.limit("30/minute")
async def interact(
    soul_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    orch: SoulOrchestrator = Depends(get_orchestrator)
):
    # 所有权校验
    if not await verify_soul_ownership(soul_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="这只灵魂不属于你，无法建立连接"
        )

    try:
        result = await orch.interact(
            soul_id=soul_id,
            user_input=payload.get("user_input", ""),
            visual_features=payload.get("visual_features"),
            context=payload.get("context")
        )
        return result
    except Exception as e:
        logger.error(f"Interact error for soul {soul_id}: {e}")
        raise HTTPException(status_code=500, detail="灵魂交互失败")

# ==================== WebSocket 安全实时通道 ====================
@app.websocket("/ws/soul/{soul_id}")
async def soul_websocket(
    websocket: WebSocket,
    soul_id: str,
    current_user: User = Depends(get_current_user),  # WebSocket也支持token
    orch: SoulOrchestrator = Depends(get_orchestrator)
):
    await websocket.accept()
    logger.info(f"🔗 Secure Soul {soul_id} 已连接 | User: {current_user.email}")

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "interact":
                # 所有权再次校验
                if not await verify_soul_ownership(soul_id, current_user.id):
                    await websocket.send_json({"type": "error", "detail": "权限不足"})
                    continue

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

            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        logger.info(f"❌ Soul {soul_id} 已断开连接")
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        await websocket.close(code=1011)

# 灵魂所有权校验辅助函数
async def verify_soul_ownership(soul_id: str, user_id: str) -> bool:
    # TODO: 实现数据库查询（PuppySoul.owner_id == user_id）
    # 当前简化版，生产环境必须实现
    return True

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
