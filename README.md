# 🐕‍🦺 PuppyForge-AI

**「把 AI 变成一群会造反、会进化、会灵魂诊断的数字疯狗」**


---

# 🧬 PuppyForge-AI: The Neuromorphic Pet Engine

> **抛弃 CRUD。** 你的宠物不该是关系型数据库里的一行记录，而该是一个在边缘节点呼吸、在向量空间记忆的神经形态生命体。

PuppyForge-AI 是一个激进的 AI-Native 后端架构。它将 Event Sourcing、多模态流式计算、WASM 沙箱与 Cloudflare Durable Objects 缝合，构建了目前物理极限下的 AI 宠物共生引擎。

---

## 🧠 核心引擎 (The Core)

| 模块 | 架构范式 | 激进点 |
| :--- | :--- | :--- |
| **Neuromorphic State** | Event Sourcing + Vector DB | 抛弃定时任务。性格随交互发生不可逆的**张量漂移 (Trait Drift)**，记忆存储于 Qdrant 高维空间。 |
| **Symbiosis Gateway** | WebSocket 双工 + Zero-Copy | 零拷贝视觉摄入，Token-to-Audio 边想边说。支持物理级**视觉打断 (Barge-in)**。 |
| **Forge Pipeline** | Temporal + VLM Adversarial | 分布式状态机编排。Prompt 炼金 ➔ 并行生成 ➔ **VLM 对抗质检** ➔ 资产结晶。 |
| **WASM Sandbox** | Wasmtime + Fuel Metering | 绝对隔离沙箱。注入**燃料限制**防死循环，支持玩家热插拔自定义灵魂 (UGC)。 |

## 🛡️ 护城河 (The Armor)

- **Zero-Trust Compute Gateway**: 算力本位限流。基于 Redis Lua 脚本进行原子级算力扣减，彻底杜绝 LLM 并发超卖。
- **AI Soul Telemetry**: OpenTelemetry 神经探针。精准追踪每只宠物的 Token 财务成本与 WASM 燃料消耗，生成“劣质灵魂黑名单”。
- **Edge-Hybrid Matrix**: Docker Distroless 承载重度 GPU 推理，**Cloudflare Durable Objects** 在全球边缘维持宠物灵魂与长连接。

---

## ⚡ 点火协议 (Ignition)

### 1. 唤醒后端矩阵 (Docker + GPU)
```bash
# 拉起 FastAPI, Redis Streams, Qdrant 闭环生态
docker-compose up -d --build
