import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from auth import router as auth_router, verify_token
from vision import router as vision_router
from interactions import router as interact_router
from websocket import router as ws_router
from souls import router as soul_router

from database import init_db, get_db, engine

# 配置日志
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def setup_global_exception_handlers(app: FastAPI):
    """设置全局异常处理器"""

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(exc)}"
        )
        
# 初始化速率限制器
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    应用生命周期管理
    启动时初始化数据库连接和表结构
    关闭时清理资源
    """
    logger.info("🚀 Starting up AI Soul Backend...")
    try:
        # 异步初始化数据库表
        await init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise
    
    yield
    
    logger.info("🛑 Shutting down AI Soul Backend...")
    # 关闭数据库引擎连接
    await engine.dispose()
    logger.info("✅ Database connections closed")

# 创建 FastAPI 应用实例
app = FastAPI(
    title="AI Soul Backend",
    description="AI Soul Backend API Documentation (Async Version)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None
)

# 注册速率限制异常处理器
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 添加安全头部中间件
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    response = await call_next(request)
    return await add_security_headers(request, response)

# CORS 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理
setup_global_exception_handlers(app)

# 安全令牌验证依赖
security = HTTPBearer()

async def verify_api_key(credentials: HTTPBearer = Depends(security)) -> str:
    """异步 API 密钥验证依赖"""
    token = credentials.credentials
    if not verify_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

@app.get("/health", tags=["Health"])
@limiter.limit("10/minute")
async def health_check(request: Request) -> dict:
    """异步健康检查端点"""
    try:
        # 获取异步数据库会话并测试连接
        db_gen = get_db()
        db: AsyncSession = await db_gen.__anext__()
        
        # 执行简单的异步查询测试连接
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "version": "1.0.0",
            "services": {
                "database": "connected",
                "redis": "configured" if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL else "not configured"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )

# 包含各个路由器 (所有路由现在都是异步的)
app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    vision_router,
    prefix="/api/v1/vision",
    tags=["Vision Diagnosis"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    interact_router,
    prefix="/api/v1/interact",
    tags=["Interactions"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    soul_router,
    prefix="/api/v1/soul",
    tags=["Soul Management"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    ws_router,
    prefix="/api/v1/ws",
    tags=["Websocket"],
    # WebSocket 通常有自己的认证机制，这里可选
    # dependencies=[Depends(verify_api_key)] 
)

@app.get("/")
async def root():
    """根路径欢迎信息"""
    return {
        "message": "Welcome to AI Soul Backend API",
        "docs": "/docs" if settings.DEBUG else "Disabled in production",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # 使用 uvicorn 运行异步应用
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
        loop="uvloop" if settings.DEBUG else "auto" # 生产环境建议使用 uvloop
    )
