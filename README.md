# 🐕‍🦺 PuppyForge-AI

**「把 AI 变成一群会造反、会进化、会灵魂诊断的数字疯狗」**


---

# 🧬 The Neuromorphic Pet Engine

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

---

## 👌 四大核心架构模块解析

### 1. Neuromorphic State (神经形态状态层)
*   **技术组合**：Event Sourcing + Vector DB (Qdrant)
*   **分析**：抛弃了传统的定时任务（Cron Job）和关系型数据库。宠物的“记忆”和“性格”被映射为高维向量存储在 Qdrant 中。这意味着宠物具备**真正的长期记忆和语义联想能力**，其性格演变是基于历史交互事件的数学推导（张量漂移），而非硬编码的状态机。

### 2. Symbiosis Gateway (共生网关层)
*   **技术组合**：WebSocket 双工 + Zero-Copy（零拷贝）
*   **分析**：解决了多模态 AI 交互中的延迟痛点。
    *   **零拷贝视觉摄入**：极大降低了图像/视频流处理时的内存开销。
    *   **Token-to-Audio 边想边说**：流式输出，打破传统“先完整生成文本再转语音”的阻塞感。
    *   **物理级视觉打断 (Barge-in)**：允许用户通过动作或声音实时打断 AI 的生成过程，模拟真实人类对话中的“插嘴”机制，沉浸感极强。

### 3. Forge Pipeline (资产锻造流水线)
*   **技术组合**：Temporal (分布式状态机) + VLM Adversarial (视觉语言模型对抗)
*   **分析**：用于处理复杂的 AI 资产生成任务。通过 Temporal 保证分布式任务（Prompt 炼金 ➔ 并行生成 ➔ 质检 ➔ 结晶）的最终一致性和容错性。引入 **VLM 对抗质检** 是一大亮点，相当于用另一个 AI 来审核生成的资产质量，形成闭环的“AI 自我博弈”机制。

### 4. WASM Sandbox (灵魂沙箱层)
*   **技术组合**：Wasmtime + Fuel Metering
*   **分析**：为 UGC（用户生成内容）提供绝对安全的运行环境。玩家可以为宠物编写自定义的“灵魂逻辑”（代码），系统通过 WASM 隔离运行，并注入**燃料限制 (Fuel Metering)** 防止恶意死循环或资源耗尽，兼顾了极高的可扩展性与系统安全性。

---

## ✌️ 基础设施与治理机制 (Telemetry & Gateway)

针对 AI 应用的痛点（算力超卖、成本失控）给出了硬核解决方案：

1.  **Zero-Trust Compute Gateway (零信任算力网关)**
    *   采用 **Redis Lua 脚本** 进行原子级的算力扣减。这彻底解决了高并发场景下 LLM 请求导致的“算力超卖”和“条件竞争”问题，实现了真正的算力本位限流。
2.  **AI Soul Telemetry (AI 灵魂遥测)**
    *   将 **OpenTelemetry** 引入 AI 代理监控。不仅追踪传统的系统指标，还精准追踪每只宠物的 **Token 财务成本** 与 **WASM 燃料消耗**。
    *   **劣质灵魂黑名单**：通过数据自动识别并限制那些消耗大量算力但产出低质量交互的“劣质 UGC 逻辑”，实现自动化治理。
3.  **Edge-Hybrid Matrix (边缘-混合矩阵)**
    *   **Cloudflare Durable Objects**：在全球边缘节点维持宠物的“灵魂状态”和 WebSocket 长连接，保证全球低延迟。
    *   **Docker Distroless**：在中心云使用极简的 Distroless 镜像承载重度 GPU 推理，兼顾安全与启动速度。

---

## ✊ 技术栈全景总结

从部署命令 `docker-compose up -d --build` 和架构描述来看，该项目的落地技术栈非常现代且硬核：
*   **后端框架**：FastAPI (Python 异步高性能框架)
*   **消息与状态**：Redis Streams (流式数据处理), Redis Lua (原子控制)
*   **向量数据库**：Qdrant (高维记忆存储)
*   **工作流编排**：Temporal (复杂状态机)
*   **沙箱环境**：Wasmtime (WebAssembly 运行时)
*   **边缘计算**：Cloudflare Durable Objects
*   **可观测性**：OpenTelemetry
---

## ⚡ 点火协议 (Ignition)

### 前置准备

确保已安装 [Docker](https://docs.docker.com/engine/install/) 和 [Docker Compose](https://docs.docker.com/compose/install/)。

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入以下必要配置：

| 变量 | 说明 | 必需 |
| :--- | :--- | :---: |
| `SECRET_KEY` | JWT 签名密钥，生产环境请用 `openssl rand -hex 32` 生成 | ✅ |
| `POSTGRES_PASSWORD` | 数据库密码 | ✅ |
| `REDIS_PASSWORD` | Redis 密码 | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | 第三方登录 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | 第三方登录 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | 第三方登录 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | 第三方登录 |
| `CF_TUNNEL_TOKEN` | Cloudflare Tunnel Token | Tunnel |

### 2. 启动服务

```bash
# 开发模式（仅后端 + 数据库）
docker compose up -d --build

# 生产模式（含 Cloudflare Tunnel）
docker compose --profile tunnel up -d --build

# 仅启动 Tunnel
docker compose --profile tunnel up -d cloudflare-tunnel
```

### 3. 验证服务

```bash
# 健康检查
curl http://localhost:8000/health

# 注册测试
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'

# 登录测试
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
```

### 4. 访问服务

| 服务 | 地址 |
| :--- | :--- |
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| Frontend | `http://localhost:3000` |

---

## 🌐 Cloudflare Tunnel

系统支持通过 Cloudflare Tunnel 暴露服务，用于第三方 OAuth 回调等需要固定公网域名的场景。

### 架构

```
用户 → https://oauth.你的域名.com → Cloudflare Edge → cloudflared → localhost:8000
```

### 配置步骤

1. **安装 cloudflared**（仅首次配置需要）
   ```bash
   docker compose --profile tunnel run cloudflare-tunnel tunnel login
   ```
   按照提示在浏览器中完成 Cloudflare 身份验证。

2. **创建 Tunnel**（或使用已有的）
   ```bash
   docker compose --profile tunnel run cloudflare-tunnel tunnel create puppyforge
   ```
   获取 Tunnel Token，填入 `.env` 的 `CF_TUNNEL_TOKEN`。

3. **Cloudflare Dashboard 配置路由**
   - 进入 Zero Trust → Networks → Tunnels → 你的 Tunnel
   - 添加 Public Hostname：
     - **Subdomain**: `oauth`
     - **Domain**: `你的域名`
     - **Type**: `HTTP`
     - **URL**: `localhost:8000`

4. **启动 Tunnel**
   ```bash
   docker compose --profile tunnel up -d cloudflare-tunnel
   ```

5. **配置 OAuth 回调 URL**
   - GitHub OAuth App: `Authorization callback URL` → `https://oauth.你的域名/api/v1/auth/github/callback`
   - Google OAuth: `Authorized redirect URIs` → `https://oauth.你的域名/api/v1/auth/google/callback`

### ⚠️ Docker DNS 问题

本环境使用 `systemd-resolved` 时 `cloudflared` 的 SRV DNS 查询会失败，因此 `docker-compose.yml` 中通过 `--edge` 参数直接指定 Cloudflare 边缘 IP，跳过 DNS 查找。如果你的环境 DNS 正常，可以去掉 `--edge` 参数使用自动发现。

---

## 🧪 测试

```bash
# 运行完整认证测试（需后端运行中）
docker cp backend/test_auth_full.py puppyforge-backend:/app/test_auth_full.py
docker exec puppyforge-backend python3 /app/test_auth_full.py

# 后端单元测试
cd backend && python -m pytest tests/ -v --tb=short

# 前端测试
cd frontend && npm test
```

---

## 🔧 故障排查

| 问题 | 可能原因 | 解决 |
| :--- | :--- | :--- |
| Tunnel 连接失败 | DNS 无法解析 SRV 记录 | 使用 `--edge` 参数指定边缘 IP |
| OAuth 回调 1016 错误 | Tunnel Public Hostname 未配置 | Dashboard 添加路由规则 |
| 第三方登录 redirect_uri 不匹配 | .env 与 OAuth App 配置不一致 | 检查两端 redirect_uri 是否完全一致 |
| 数据库连接失败 | PostgreSQL 未就绪 | `docker compose logs postgres` 查看 |
| JWT 认证失败 | SECRET_KEY 不一致 | 检查 .env 配置 |
