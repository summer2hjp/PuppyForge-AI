from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
import json

from database import get_db
from auth import get_current_user
from models.auth import User

router = APIRouter(prefix="/ws", tags=["Websocket"])

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

ws_router = router

@router.websocket("/diagnosis/{user_id}")
async def websocket_diagnosis(
    websocket: WebSocket,
    user_id: int,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    from auth import verify_token
    try:
        payload = verify_token(token)
        if str(payload.get("sub")) != str(user_id):
            await websocket.close(code=4001, reason="Invalid token user mismatch")
            return
    except Exception:
        await websocket.close(code=4002, reason="Invalid token")
        return

    await manager.connect(websocket, user_id)
    try:
        await websocket.send_json({"type": "connected", "message": "已连接到诊断服务"})
        
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({
                "type": "echo",
                "data": data,
                "status": "received"
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
