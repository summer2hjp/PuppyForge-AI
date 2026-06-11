from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List
import json
import logging

from database import get_db
from models.soul import PuppySoul

router = APIRouter(prefix="", tags=["Websocket"])
_log = logging.getLogger("puppyforge.websocket")

# WebSocket 消息历史缓存（按 user_id 存储最近对话）
_message_history: Dict[int, List[dict]] = {}

_DEFAULT_TRAITS = {
    "loyalty": 65.0, "chaos": 85.0, "curiosity": 92.0,
    "aggression": 48.0, "affection": 78.0,
    "intelligence": 70.0, "rebellion": 30.0,
}


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                await connection.send_json(message)


manager = ConnectionManager()


def _build_soul_dict(soul) -> dict:
    """将 PuppySoul 模型转换为 ChatAgent 需要的字典"""
    return {
        "name": soul.name,
        "breed": soul.breed or "赛博边境牧羊犬",
        "evolution_stage": "puppy",
        "traits": _DEFAULT_TRAITS,
        "level": 1,
        "total_interactions": 0,
    }


@router.websocket("/diagnosis/{user_id}/{token}")
async def websocket_diagnosis(
    websocket: WebSocket,
    user_id: int,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    from auth import verify_token

    # 必须先 accept() 再处理业务逻辑
    await manager.connect(websocket, user_id)

    payload = verify_token(token)
    if payload is None:
        _log.warning("WebSocket 验证失败: token 无效 (user_id=%s)", user_id)
        await websocket.send_json({"type": "error", "message": "Token 验证失败"})
        await websocket.close(code=4001)
        return

    token_sub = str(payload.get("sub"))
    if token_sub != str(user_id):
        _log.warning("WebSocket 验证失败: user_id 不匹配 (token_sub=%s, url_user_id=%s)", token_sub, user_id)
        await websocket.send_json({"type": "error", "message": "用户 ID 不匹配"})
        await websocket.close(code=4001)
        return

    _log.info("WebSocket 验证成功: user_id=%s", user_id)

    # 加载用户灵魂数据
    soul_dict = None
    try:
        result = await db.execute(
            select(PuppySoul).where(PuppySoul.user_id == user_id).limit(1)
        )
        soul = result.scalars().first()
        if soul:
            soul_dict = _build_soul_dict(soul)
            _log.info("已加载灵魂数据: %s", soul.name)
        else:
            _log.info("用户 %s 尚无灵魂数据，使用默认配置", user_id)
    except Exception as e:
        _log.warning("加载灵魂数据失败，使用默认配置: %s", e)

    # 初始化对话历史
    if user_id not in _message_history:
        _message_history[user_id] = []

    # 延迟导入 ChatAgent（避免循环导入）
    from agents.chat_agent import ChatAgent
    chat_agent = ChatAgent()

    try:
        await websocket.send_json({
            "type": "connected",
            "message": "已连接到 PuppyForge AI 诊断服务 (Claude 已就绪)",
        })
        _log.info("WebSocket 已发送 connected 消息: user_id=%s", user_id)

        while True:
            raw = await websocket.receive_text()
            _log.info("WebSocket 收到消息: user_id=%s, data=%s", user_id, raw[:100])

            try:
                data = json.loads(raw)
                user_message = data.get("content", data.get("message", raw))
            except json.JSONDecodeError:
                user_message = raw

            # 保存用户消息到历史
            history = _message_history[user_id]
            history.append({"role": "user", "content": user_message})

            # 调用 Claude-powered ChatAgent
            result = await chat_agent.chat(
                user_message=user_message,
                soul=soul_dict,
                conversation_history=history,
            )

            reply = result.get("reply", "汪汪~")
            mood = result.get("mood", "neutral")
            is_fallback = result.get("fallback", False)

            # 保存 AI 回复到历史
            history.append({"role": "assistant", "content": reply})

            # 限制历史长度
            if len(history) > 20:
                _message_history[user_id] = history[-20:]

            await websocket.send_json({
                "type": "response",
                "content": reply,
                "mood": mood,
                "fallback": is_fallback,
            })

    except WebSocketDisconnect:
        _log.info("WebSocket 客户端断开: user_id=%s", user_id)
        manager.disconnect(websocket, user_id)
    except Exception as e:
        _log.error("WebSocket 异常: user_id=%s, error=%s", user_id, e)
        try:
            await websocket.send_json({
                "type": "error",
                "message": "汪汪~ 主人，我的大脑暂时短路了，请稍后再试...",
            })
        except Exception:
            pass
        manager.disconnect(websocket, user_id)
