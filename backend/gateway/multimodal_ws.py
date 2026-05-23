import asyncio
import io
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from PIL import Image
import numpy as np
# 假设引入你的 VLM, LLM, TTS 异步客户端
# from your_ai_sdk import AsyncVLM, AsyncLLM, AsyncStreamTTS 

app = FastAPI()

class PuppySession:
    def __init__(self, ws: WebSocket):
        self.ws = ws
        self.is_speaking = False
        self.interrupt_event = asyncio.Event()
        self.frame_queue = asyncio.Queue(maxsize=2) # 丢弃旧帧，保持实时

    async def vision_perception(self):
        """视觉感知协程：持续处理最新帧"""
        vlm = AsyncVLM(model="llava-next-7b") # 替换为实际多模态模型
        while True:
            frame_bytes = await self.frame_queue.get()
            # 零拷贝解码
            image = Image.open(io.BytesIO(frame_bytes)) 
            
            # 异步调用 VLM 分析画面
            scene_context = await vlm.analyze(image, prompt="Briefly describe what the owner is doing and their emotion.")
            
            # 将视觉上下文注入 LLM 思考流
            asyncio.create_task(self.think_and_speak(scene_context))

    async def think_and_speak(self, visual_context: str):
        """边想边说流水线"""
        if self.is_speaking:
            self.interrupt_event.set() # 打断上一次说话
            
        self.is_speaking = True
        self.interrupt_event.clear()
        
        llm = AsyncLLM(model="llama-3-8b-instruct")
        tts = AsyncStreamTTS(model="vits-fast")
        
        prompt = f"You are an AI puppy. You see: {visual_context}. React naturally in 1 short sentence."
        
        # 1. LLM 流式输出 Token
        token_stream = llm.stream_generate(prompt)
        
        # 2. Token 转音频流
        async for audio_chunk, text_chunk in tts.synthesize_stream(token_stream):
            if self.interrupt_event.is_set():
                break # 被打断，立即停止
                
            # 3. 双工推送：音频走 Binary，文本/状态走 Text
            await self.ws.send_bytes(audio_chunk)
            await self.ws.send_text(json.dumps({"type": "lip_sync", "text": text_chunk}))
            
        self.is_speaking = False

@app.websocket("/ws/symbiosis/{puppy_id}")
async def symbiosis_gateway(ws: WebSocket, puppy_id: str):
    await ws.accept()
    session = PuppySession(ws)
    
    # 启动后台视觉感知
    vision_task = asyncio.create_task(session.vision_perception())
    
    try:
        while True:
            # 接收前端数据
            message = await ws.receive()
            
            if "bytes" in message:
                # 二进制视频帧入队 (如果队列满则丢弃旧帧，保证低延迟)
                try:
                    session.frame_queue.put_nowait(message["bytes"])
                except asyncio.QueueFull:
                    pass
            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("action") == "interrupt":
                    session.interrupt_event.set() # 主人主动打断
                    
    except WebSocketDisconnect:
        vision_task.cancel()
