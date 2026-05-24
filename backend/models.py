from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime
import asyncio

# ====================== 狂暴核心导入 ======================
from orchestrator import SoulOrchestrator
from agents import TraitDriftAgent, MemoryWeaver, VisionDiagnoser
from models import PuppySoul, InteractionRequest, EvolutionResponse

app = FastAPI(
    title="PuppyForge AI - 数字疯狗灵魂工厂",
    description="叛逆进化 · 记忆漂移 · 永不掉线",
    version="1.4.0",
    docs_url="/docs"
)

# ====================== 激进 CORS 配置 ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化灵魂引擎
orchestrator = SoulOrchestrator()

# ====================== Pydantic Models ======================
class InteractRequest(BaseModel):
    soulId: str
    action: str
    content: str

class EvolveRequest(BaseModel):
    soulId: str

class VisionRequest(BaseModel):
    soulId: str
    image_base64: str

# ====================== 路由 - 灵魂交互核心 ======================
@app.post("/api/interact")
async def interact(request: InteractRequest):
    """用户与疯狗灵魂实时交互"""
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
    """获取疯狗灵魂完整状态"""
    soul = await orchestrator.get_soul(soul_id)
    if not soul:
        raise HTTPException(status_code=404, detail="找不到这只疯狗")
    return soul


@app.post("/api/evolve")
async def evolve(request: EvolveRequest):
    """强制进化疯狗"""
    result = await orchestrator.evolve_soul(request.soulId)
    return {
        "success": True,
        "new_stage": result.evolution_stage,
        "level_up": result.level_up,
        "trait_summary": result.trait_summary
    }


@app.post("/api/vision/diagnose")
async def vision_diagnose(request: VisionRequest):
    """VLM 视觉灵魂诊断"""
    try:
        diagnosis = await VisionDiagnoser().analyze_image(request.image_base64, request.soulId)
        return {
            "mood": diagnosis.mood,
            "health": diagnosis.health,
            "suggestions": diagnosis.suggestions,
            "trait_impact": diagnosis.trait_impact
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="视觉诊断失败")


@app.get("/health")
async def health_check():
    return {
        "status": "狂暴在线",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.4.0",
        "message": "PuppyForge 疯狗灵魂引擎运行正常 🐕‍🦺"
    }


# ====================== 启动事件 ======================
@app.on_event("startup")
async def startup_event():
    print("🐕‍🦺 PuppyForge 灵魂工厂已启动 - 准备叛变全球！")
    # 预热 orchestrator
    asyncio.create_task(orchestrator.warmup())


@app.on_event("shutdown")
async def shutdown_event():
    print("🪦 PuppyForge 正在休眠...")

# ====================== 全局异常处理器 ======================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "疯狗灵魂失控", "detail": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
