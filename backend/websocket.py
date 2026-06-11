from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
import json

from database import get_db

router = APIRouter(prefix="", tags=["Websocket"])

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

@router.websocket("/diagnosis/{user_id}/{token}")
async def websocket_diagnosis(
    websocket: WebSocket,
    user_id: int,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    from auth import verify_token
    import logging
    _log = logging.getLogger(__name__)

    # 必须先 accept() 再处理业务逻辑，否则 close() 会返回 403
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

    try:
        await websocket.send_json({"type": "connected", "message": "已连接到诊断服务"})
        _log.info("WebSocket 已发送 connected 消息: user_id=%s", user_id)

        while True:
            data = await websocket.receive_text()
            _log.info("WebSocket 收到消息: user_id=%s, data=%s", user_id, data[:100])
            await websocket.send_json({
                "type": "echo",
                "data": data,
                "status": "received"
            })

    except WebSocketDisconnect:
        _log.info("WebSocket 客户端断开: user_id=%s", user_id)
        manager.disconnect(websocket, user_id)
    except Exception as e:
        _log.error("WebSocket 异常: user_id=%s, error=%s", user_id, e)
        manager.disconnect(websocket, user_id)
