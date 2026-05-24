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
    logger.error(f"未捕获
