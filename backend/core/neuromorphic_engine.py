import asyncio
import uuid
from datetime import datetime
from pydantic import BaseModel
from fastapi import FastAPI, BackgroundTasks
from redis.asyncio import Redis
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams
import litellm # 假设使用 litellm 统一异步调用各类 LLM

app = FastAPI()
redis = Redis.from_url("redis://localhost:6379", decode_responses=True)
qdrant = AsyncQdrantClient(url="http://localhost:6363")

# 初始化向量库 (性格与记忆维度)
COLLECTION = "puppy_brain"
async def init_brain():
    if not await qdrant.collection_exists(COLLECTION):
        await qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE) # 假设 Embedding 维度 1024
        )
app.add_event_handler("startup", init_brain)

class InteractionEvent(BaseModel):
    puppy_id: str
    action: str  # e.g., "feed", "scold", "play", "ignore"
    context: str # 环境上下文

# 1. 极速事件摄入 (不阻塞主线程)
@app.post("/api/v1/interact")
async def interact(event: InteractionEvent):
    event_id = str(uuid.uuid4())
    payload = event.model_dump_json()
    # 写入 Redis Stream，立即返回
    await redis.xadd(f"puppy_events:{event.puppy_id}", {"id": event_id, "data": payload})
    return {"status": "event_ingested", "event_id": event_id}

# 2. 神经形态演化引擎 (后台常驻 Worker)
async def persona_mutator_worker():
    """
    激进设计：宠物性格不是固定数值，而是随着记忆不断漂移的向量。
    """
    consumer_group = "brain_mutators"
    stream_key = "puppy_events:*" # 实际生产中需动态订阅或按 puppy_id 分发
    
    # 伪代码：订阅所有 puppy 的 stream
    while True:
        # 阻塞读取新事件
        streams = await redis.xreadgroup(consumer_group, "worker_1", {"puppy_events:*": ">"}, block=0, count=10)
        
        for stream, messages in streams:
            puppy_id = stream.split(":")[1]
            for msg_id, msg_data in messages:
                event = InteractionEvent.model_validate_json(msg_data["data"])
                
                # A. 生成记忆 Embedding
                memory_text = f"At {datetime.now()}, owner did: {event.action}. Context: {event.context}"
                embedding = await litellm.aembedding(model="text-embedding-3-large", input=[memory_text])
                
                # B. 写入 Qdrant 长期记忆
                await qdrant.upsert(
                    collection_name=COLLECTION,
                    points=[PointStruct(
                        id=str(uuid.uuid4()),
                        vector=embedding.data[0]["embedding"],
                        payload={"puppy_id": puppy_id, "memory": memory_text, "timestamp": datetime.now().isoformat()}
                    )]
                )
                
                # C. 触发 LLM 性格突变 (异步)
                asyncio.create_task(mutate_persona(puppy_id, event))
                
                # 确认消费
                await redis.xack(stream, consumer_group, msg_id)

async def mutate_persona(puppy_id: str, event: InteractionEvent):
    """
    使用 LLM 评估事件对宠物潜意识的影响，输出性格漂移向量。
    """
    # 检索最近的长期记忆作为 Prompt 上下文
    recent_memories = await qdrant.search(
        collection_name=COLLECTION,
        query_vector=(await litellm.aembedding(model="text-embedding-3-large", input=[event.context])).data[0]["embedding"],
        limit=5,
        query_filter={"must": [{"key": "puppy_id", "match": {"value": puppy_id}}]}
    )
    
    prompt = f"""
    You are the subconscious of an AI puppy. 
    Recent memories: {[m.payload['memory'] for m in recent_memories]}
    Latest event: Owner {event.action}.
    Output a JSON with:
    1. "internal_monologue": brief thought.
    2. "trait_drift": dictionary of trait changes (e.g., {{"trust": 0.1, "neuroticism": -0.05}}).
    """
    
    response = await litellm.acompletion(
        model="gpt-4o", # 或本地部署的 Llama-3
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    # 将 trait_drift 写入 Redis Hash 作为实时性格状态
    # 后续渲染层根据这个 Hash 实时改变宠物的 3D 模型/2D 动画和对话语气
    drift = eval(response.choices[0].message.content)["trait_drift"] 
    for trait, delta in drift.items():
        await redis.hincrbyfloat(f"puppy_persona:{puppy_id}", trait, delta)

# 启动 Worker (生产环境应使用 Celery/ARQ/Temporal)
@app.on_event("startup")
async def start_workers():
    asyncio.create_task(persona_mutator_worker())
