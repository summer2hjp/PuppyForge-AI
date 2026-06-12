# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuppyForge-AI — AI 宠物管理与锻造平台。核心概念是 **Soul（灵魂）**：每个宠物拥有一个可演化的 Soul，通过 AI 诊断、成长模拟、视觉分析、Rebel 反叛系统、记忆编织等机制持续进化。

## Quick Start

```bash
# 1. 环境配置
cp .env.example .env         # 编辑 .env 填入必要配置
openssl rand -hex 32         # 生成 SECRET_KEY

# 2. Docker 开发模式（推荐）
docker compose up -d --build

# 3. 验证
curl http://localhost:8000/health
```

## Build & Test Commands

### Frontend (Next.js 14 — `frontend/`)
```bash
npm install                  # 安装依赖
npm run dev                  # dev server (localhost:3000)
npm run build                # production build
npm run start                # production start
npm run lint                 # ESLint
npm run type-check           # tsc --noEmit
npm test                     # Jest (config: __tests__/utils/jest.config.js)
npm run test:ci              # Jest CI mode (coverage, maxWorkers=2)
npm run test:watch           # Jest watch mode
```

### Backend (FastAPI — `backend/`)
```bash
pip install -r requirements.txt     # 安装依赖
uvicorn main:app --reload           # dev server (localhost:8000)

python -m pytest tests/ -v --tb=short            # 全部测试
python -m pytest tests/test_file.py -v           # 单个文件
python -m pytest -k "test_name" -v               # 特定测试
python -m pytest --cov=. --cov-report=term-missing  # 测试覆盖率
```

### E2E Tests (Playwright — project root)
```bash
npx playwright test           # 所有 E2E
npx playwright test --debug   # 调试模式
npx playwright test --ui      # UI 模式
npx playwright show-report    # 查看报告
```

### Docker
```bash
docker compose up -d --build                          # 开发模式
docker compose --profile tunnel up -d --build         # 生产（含 Cloudflare Tunnel）
docker compose logs backend -f                        # 后端日志
docker compose exec backend python3 -m pytest -v      # 容器内测试
```

## Project Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PuppyForge-AI                              │
│                                                                   │
│  ┌──────────────────┐  ┌─────────────────────┐                  │
│  │   Frontend :3000  │  │   Backend :8000      │                  │
│  │   Next.js 14      │  │   FastAPI/Python 3   │                  │
│  │                   │  │                     │                  │
│  │  ┌─────────────┐  │  │  ┌───────────────┐  │  ┌────────────┐ │
│  │  │ AI Agents   │  │  │  │ AI Agents     │  │  │ Edge       │ │
│  │  │ (Swarm)     │◄─┼──┼─►│ (Orchestrator)│  │  │ Workers    │ │
│  │  └─────────────┘  │  │  └───────┬───────┘  │  │ (CF)       │ │
│  │                   │  │          │           │  └────────────┘ │
│  │  ┌─────────────┐  │  │  ┌───────┴───────┐  │                 │
│  │  │ WebSocket   │◄─┼──┼─►│ Multimodal WS │  │                 │
│  │  │ Client      │  │  │  │ Gateway       │  │                 │
│  │  └─────────────┘  │  │  └───────────────┘  │                 │
│  │                   │  │                     │                 │
│  │  ┌─────────────┐  │  │  ┌───────────────┐  │                 │
│  │  │ Zustand     │  │  │  │ Forge Pipeline│  │                 │
│  │  │ Store       │  │  │  │ (4-stage)     │  │                 │
│  │  └─────────────┘  │  │  └───────────────┘  │                 │
│  └────────┬─────────┘  └────────┬────────────┘                  │
│           │                     │                                │
│           └──────────┬──────────┘                                │
│                      │                                           │
│             ┌────────┴────────┐                                  │
│             │   PostgreSQL    │  (主存储, SQLAlchemy async)     │
│             │   Redis         │  (缓存/限流/黑名单/队列)        │
│             │   Qdrant        │  (向量记忆存储, 相似度检索)     │
│             └─────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Key System Architecture

### Frontend (`frontend/`)

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router 页面 + API routes (`auth/`, `diagnosis/`, `forge/`, `growth/`, `rebel/`, etc.) |
| `components/` | React 组件 — 视觉分析、锻造、进化、反叛面板、仪表盘等 |
| `ai-agents/` | 前端 AI Agent 系统 — Swarm 编排、4 类 Agent（Diagnosis/Prediction/Growth/Rebel）、记忆管理 |
| `lib/` | 核心工具库 — auth、API client、WebSocket client、诊断、视觉分析、Grok prompts |
| `hooks/` | 自定义 Hooks — `useAuth`, `usePuppySoul`, `useSoulWebSocket` |
| `store/` | Zustand 状态管理 |
| `__tests__/` | Jest 测试 + Playwright E2E |

**Key dependencies**: Next.js 14, React 18, Three.js/R3F, Framer Motion, Zustand 4, sonner, Serwist (PWA), jose (JWT), bcryptjs

### Backend (`backend/`)

| Directory | Purpose |
|-----------|---------|
| `agents/` | AI Agent 实现 — base, chat, diagnosis, growth, memory, memory_weaver, prediction, rebel, trait_drift, vision, orchestrator |
| `models/` | SQLAlchemy ORM 模型 — auth, diagnosis, interaction, soul |
| `core/` | 核心引擎 — Neuromorphic Engine、WASM Sandbox |
| `forge/` | 锻造模块 — 4 阶段炼金流水线 + 路由 |
| `gateway/` | Multimodal WebSocket 网关（视觉+语音+文本流） |
| `vision/` | 视觉分析 — Soul 诊断 |
| `security/` | 零信任网关 |
| `sandbox/` | WASM 沙盒（Brain runtime） |
| `observability/` | 可观测性 — 神经探针、Prometheus/OpenTelemetry |
| `tasks/` | Celery 后台任务 + Swarm 任务 |
| `tests/` | pytest 测试 |

**Key dependencies**: FastAPI, SQLAlchemy async, asyncpg, Redis, Qdrant, LiteLLM, slowapi, OpenTelemetry, Prometheus, Celery, wasmtime, langgraph

## Critical Data Flows

### 1. AI Agent Pipeline (Frontend → Backend Agent → LLM → Qdrant)
```
Frontend Swarm Agent
  → API call (JWT auth)
    → Backend Agent (orchestrator dispatches to specialized agent)
      → LiteLLM routing (OpenAI/Anthropic/Ollama)
        → Response generation
          → Qdrant vector memory storage (long-term)
            → Response to frontend
```

### 2. WebSocket Real-time Communication
```
Frontend WebSocket Client
  → Multimodal Gateway (backend/gateway/multimodal_ws.py)
    → Parallel coroutines:
      - vision_perception (VLM frame analysis)
      - think_and_speak (streaming LLM + TTS)
      - interrupt/override handling
  → Bidirectional stream (text/audio/vision frames)
```

### 3. Forge Pipeline (4-stage Alchemy)
```
Stage 1: Alchemy (prompt → content generation)
Stage 2: Transmutation (content refinement)
Stage 3: Distillation (quality scoring)
Stage 4: Crystallization → Qdrant storage (immutable memory)
```

### 4. Soul Evolution System
```
Pet Interaction → Trait Drift (personality mutation)
  → Fuel Decay (energy consumption)
    → Rebel Threshold check
      → Rebel events (if threshold exceeded)
        → Memory weaving (experience consolidation)
          → Growth prediction (next stage forecast)
```

## Architecture Highlights

### AI Agent System
- **Frontend agents** (`frontend/ai-agents/`): Swarm orchestrator with 4 specialized agents (Diagnosis, Prediction, Growth, Rebel). Memory in `memory/puppy-long-term-memory.ts`. Prompt templates in `prompts/`.
- **Backend agents** (`backend/agents/`): Server-side agents with memory weaving, trait drift, chat, vision. Orchestrator in `orchestrator.py`.
- **LLM routing**: LiteLLM supports OpenAI, Anthropic, Ollama — configured via `config.py` (`LLM_PROVIDER`, `LLM_MODEL`).
- **Vector memory**: Qdrant stores puppet soul memories, supports similarity search via `QDRANT_COLLECTION`.

### Authentication
- **Backend**: JWT (access+refresh tokens, configurable expiry), API Key, OAuth (GitHub, Google)
- **Frontend**: `lib/auth.ts` manages token storage/refresh; `api/auth/` routes proxy to FastAPI
- **OAuth**: Callbacks via Cloudflare Tunnel to public domain; configured in `.env`

### Real-time Systems
- **WebSocket Gateway**: Multimodal protocol supporting vision frames, streaming LLM, TTS audio — all in parallel coroutines with interrupt support
- **Soul WebSocket**: `frontend/lib/soul-websocket.ts` + `backend/websocket.py` for real-time pet state updates

### Vision & Diagnosis
- **Frontend**: `VisionAnalyzer.tsx`, `VisionDiagnoser.tsx` capture/analyze pet images
- **Backend**: `vision/` module + `vision_agent.py` for deep analysis
- **Processing**: Frame capture → VLM analysis → emotion vector extraction → diagnosis results

### Rebel System
- Configurable threshold (`REBEL_THRESHOLD=0.65` in `.env`)
- Rebel events triggered when personality drift exceeds threshold
- `MutualRebelCanvas.tsx` + `RebelliousChat.tsx` for visual rebel interactions
- Backend `rebel_agent.py` manages rebel state transitions

### Unique Backend Components
- **Neuromorphic Engine** (`core/neuromorphic_engine.py`): Spiking neural network simulation for pet brain
- **WASM Sandbox** (`sandbox/wasm_brain.py`): WebAssembly pet brain runtime
- **Zero Trust Gateway** (`security/zero_trust_gateway.py`): Request-level auth enforcement
- **Neural Probes** (`observability/neural_probes.py`): Agent-level observability via OpenTelemetry

### Background Tasks
- **Celery** (`celery_app.py`): Async task queue
- **Swarm Tasks** (`tasks/swarm_tasks.py`): Background swarm orchestration

## Key Configuration

### Environment Variables (.env)
180+ configurable parameters across 8 categories:
- **Database**: PostgreSQL (asyncpg), Redis (AOF persistent)
- **Auth**: JWT, OAuth (GitHub/Google), API Keys
- **AI/LLM**: Provider, model, temperature, streaming timeout
- **Vector Store**: Qdrant host/port/collection
- **Soul System**: Fuel decay rate, trait drift intensity, rebel threshold
- **Observability**: Sentry DSN, OpenTelemetry, Prometheus
- **Feature Flags**: Rebel mode, memory persistence, swarm orchestration
- **Infrastructure**: Port mappings, S3, PWA, CORS

### Testing
- **Jest** (frontend): `__tests__/utils/jest.config.js` — next/jest, jsdom, `@/` alias
- **Playwright**: `playwright.config.ts` — chromium/firefox/webkit, HTML reporter
- **pytest** (backend): `tests/conftest.py` async fixtures, `pyproject.toml` asyncio_mode=auto
- Jest config excludes `__tests__/e2e/` and `__tests__/integration/`

### CI/CD
- `.github/workflows/test-ci.yml` — Push/PR → parallel backend (pytest + coverage) + frontend (Jest)
- `.github/workflows/playwright.yml` — E2E tests with HTML report artifact (30-day retention)
