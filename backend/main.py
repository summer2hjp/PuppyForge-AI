from fastapi import FastAPI, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import logging
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlmodel import select

from config import settings
from auth import router as auth_router, get_current_user
from models.auth import User
from orchestrator import SoulOrchestrator
from models import ErrorResponse, InteractionResult, PuppySoul
from database import get_db
from sqlmodel import Session

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
    logger.error(f"未捕获异常：{exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(message="灵魂引擎异常", detail="请稍后重试").model_dump()
    )

# ==================== 依赖 ====================
orchestrator = SoulOrchestrator()

def get_orchestrator():
    return orchestrator


async def verify_soul_ownership(soul_id: str, user_id: str, db: Session) -> bool:
    """验证灵魂所有权"""
    soul = db.exec(select(PuppySoul).where(PuppySoul.id == soul_id)).first()
    if not soul:
        return False
    # 允许无主灵魂或当前用户拥有的灵魂
    return soul.owner_id is None or soul.owner_id == user_id


# ==================== 路由 ====================
# 添加 API 前缀以匹配前端调用
app.include_router(auth_router, prefix="/api")


@app.get("/")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def root():
    return {
        "status": "running",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


# 注册视觉诊断路由
from vision.soul_diagnosis import router as vision_router
app.include_router(vision_router, prefix="/api")


@app.post("/api/interact/{soul_id}", response_model=InteractionResult)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def interact(
    soul_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    orch: SoulOrchestrator = Depends(get_orchestrator),
    db: Session = Depends(get_db)
):
    """与灵魂交互的核心接口"""
    if not await verify_soul_ownership(soul_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="权限不足：您不是该灵魂的主人")
    
    try:
        result = await orch.interact(
            soul_id=soul_id,
            user_input=payload.get("user_input", ""),
            visual_features=payload.get("visual_features"),
            context=payload.get("context")
        )
        return result
    except Exception as e:
        logger.error(f"Interaction failed for soul {soul_id}: {e}")
        raise HTTPException(status_code=500, detail=f"交互失败：{str(e)}")


@app.get("/api/soul/{soul_id}")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def get_soul(
    soul_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取灵魂状态"""
    if not await verify_soul_ownership(soul_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="权限不足")
    
    soul = db.exec(select(PuppySoul).where(PuppySoul.id == soul_id)).first()
    if not soul:
        raise HTTPException(status_code=404, detail="灵魂不存在")
    
    return soul


@app.post("/api/evolve/{soul_id}")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def evolve_soul(
    soul_id: str,
    current_user: User = Depends(get_current_user),
    orch: SoulOrchestrator = Depends(get_orchestrator),
    db: Session = Depends(get_db)
):
    """灵魂进化"""
    if not await verify_soul_ownership(soul_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="权限不足")
    
    # TODO: 实现进化逻辑
    return {"message": f"灵魂 {soul_id} 进化中...", "status": "processing"}


# ==================== WebSocket ====================
@app.websocket("/ws/soul/{soul_id}")
async def soul_websocket(
    websocket: WebSocket,
    soul_id: str,
    orch: SoulOrchestrator = Depends(get_orchestrator)
):
    """灵魂实时通信通道"""
    await websocket.accept()
    logger.info(f"🔗 Soul {soul_id} WebSocket 已连接")
    
    try:
        while True:
            data = await websocket.receive_text()
            # 处理实时消息
            await websocket.send_text(f"收到：{data}")
    except WebSocketDisconnect:
        logger.info(f"🔌 Soul {soul_id} WebSocket 断开")


@app.websocket("/ws/persona/{puppy_id}")
async def persona_websocket(
    websocket: WebSocket,
    puppy_id: str
):
    """人格式实时通信通道（前端 personaWS 使用）"""
    await websocket.accept()
    logger.info(f"🎭 Persona {puppy_id} WebSocket 已连接")
    
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # 广播人格更新
                await websocket.send_json({
                    "type": "persona_update",
                    "puppy_id": puppy_id,
                    "data": {"status": "active"}
                })
    except WebSocketDisconnect:
        logger.info(f"🔌 Persona {puppy_id} WebSocket 断开")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
