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

# ==================== 日志 ====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("puppyforge")

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🐾 {settings.PROJECT_NAME} v{settings.VERSION} 已启动 | Auth + Security 就绪")
    yield
    logger.info("👋 PuppyForge 已安全关闭")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==================== CORS ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 全局异常 ====================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未捕获异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(message="灵魂引擎异常", detail="请稍后重试").model_dump()
    )

# ==================== 依赖 ====================
orchestrator = SoulOrchestrator()

def get_orchestrator():
    return orchestrator

# ==================== 路由 ====================
app.include_router(auth_router)

@app.get("/")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def root():
    return {
        "status": "running",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.post("/api/interact/{soul_id}", response_model=InteractionResult)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def interact(
    soul_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    orch: SoulOrchestrator = Depends(get_orchestrator)
):
    if not await verify_soul_ownership(soul_id, current_user.id):
        raise HTTPException(status_code=403, detail="权限不足")
    
    try:
        result = await orch.interact(
            soul_id=soul_id,
            user_input=payload.get("user_input", ""),
            visual_features=payload.get("visual_features"),
            context=payload.get("context")
        )
        return result
    except Exception as e:
        logger.error(f"Interaction failed: {e}")
        raise

# WebSocket 保持不变...
@app.websocket("/ws/soul/{soul_id}")
async def soul_websocket(
    websocket: WebSocket,
    soul_id: str,
    current_user: User = Depends(get_current_user),
    orch: SoulOrchestrator = Depends(get_orchestrator)
):
    await websocket.accept()
    logger.info(f"🔗 Soul {soul_id} connected - User: {current_user.email}")
    # ... 其他逻辑保持
    pass

async def verify_soul_ownership(soul_id: str, user_id: str) -> bool:
    # TODO: 实现真实查询
    return True

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
