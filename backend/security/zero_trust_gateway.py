import jwt
import time
import redis.asyncio as redis
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 初始化 Redis 与 Lua 脚本
redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)

# 激进设计：Lua 脚本保证算力扣减的绝对原子性，防止并发超卖
LUA_COMPUTE_METER = """
local current_used = tonumber(redis.call('GET', KEYS[1]) or "0")
local requested = tonumber(ARGV[1])
local max_quota = tonumber(ARGV[2])

if current_used + requested > max_quota then
    return 0  -- 算力破产，拒绝访问
end

redis.call('INCRBY', KEYS[1], requested)
redis.call('EXPIRE', KEYS[1], 86400) -- 24小时滑动重置
return 1
"""

security = HTTPBearer()

class ZeroTrustGate:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.lua_sha = None

    async def init_lua(self):
        if not self.lua_sha:
            self.lua_sha = await redis_client.script_load(LUA_COMPUTE_METER)

    def estimate_cost(self, request: Request) -> int:
        """动态预估本次请求的算力成本 (Mock 逻辑)"""
        path = request.url.path
        if "forge" in path: return 5000  # 锻造流水线：重算力
        if "interact" in path: return 50   # 神经形态交互：轻算力
        if "ws/symbiosis" in path: return 10 # 多模态网关：按帧计费
        return 10

    async def __call__(self, request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
        await self.init_lua()
        token = credentials.credentials
        
        try:
            # 1. 零信任身份校验
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            user_id = payload.get("sub")
            max_quota = payload.get("compute_quota", 10000) # 默认每日 1 万算力
            
            # 2. 设备指纹校验 (防 Token 盗用)
            # if payload.get("device_hash") != hash(request.client.host + request.headers.get("user-agent", "")):
            #     raise HTTPException(status_code=401, detail="Device mismatch")

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

        # 3. 算力原子扣减
        estimated_cost = self.estimate_cost(request)
        quota_key = f"compute_quota:{user_id}:{time.strftime('%Y%m%d')}"
        
        allowed = await redis_client.evalsha(self.lua_sha, 1, quota_key, estimated_cost, max_quota)
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
                detail=f"Compute Quota Exceeded. Need {estimated_cost}, Max {max_quota}."
            )

        # 将用户信息注入请求上下文
        request.state.user_id = user_id
        request.state.compute_cost = estimated_cost
        return user_id

# 实例化网关 (生产环境从环境变量读取 SECRET)
gate = ZeroTrustGate(secret_key="SUPER_SECRET_FORGE_KEY")

# 使用方式：在需要保护的路由上注入
# @app.post("/api/v1/forge")
# async def forge_pet(user_id: str = Depends(gate)):
#     ...
