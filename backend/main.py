from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from backend.core.neuromorphic_engine import NeuromorphicEngine, InteractionEvent
from backend.agents.orchestrator import SwarmOrchestrator
from backend.forge.pipeline import ForgePipeline
from backend.observability.neural_probes import NeuralProbes, tracer
from backend.agents.rebel_agent import rebel_agent
import uvicorn
from typing import Dict, Any, List
import asyncio
import json

app = FastAPI(title="PuppyForge-AI", version="0.3.0")

probes = NeuralProbes()
probes.setup_instrumentation(app)

engine = NeuromorphicEngine()
orchestrator = SwarmOrchestrator()
forge = ForgePipeline()

# ==================== WebSocket 实时人格同步 ====================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.puppy_subscribers: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, puppy_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        if puppy_id not in self.puppy_subscribers:
            self.puppy_subscribers[puppy_id] = []
        self.puppy_subscribers[puppy_id].append(websocket)

    def disconnect(self, websocket: WebSocket, puppy_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if puppy_id in self.puppy_subscribers:
            if websocket in self.puppy_subscribers[puppy_id]:
                self.puppy_subscribers[puppy_id].remove(websocket)

    async def broadcast_to_puppy(self, puppy_id: str, message: Dict):
        """定向广播给订阅该 puppy_id 的客户端"""
        if puppy_id not in self.puppy_subscribers:
            return
        dead_connections = []
        for connection in self.puppy_subscribers[puppy_id]:
            try:
                await connection.send_text(json.dumps(message))
            except:
                dead_connections.append(connection)
        # 清理断开连接
        for dead in dead_connections:
            self.disconnect(dead, puppy_id)

manager = ConnectionManager()


@app.websocket("/ws/persona/{puppy_id}")
async def websocket_persona(websocket: WebSocket, puppy_id: str):
    """实时人格同步通道"""
    await manager.connect(websocket, puppy_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps
