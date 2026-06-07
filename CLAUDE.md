# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuppyForge-AI is an AI-native pet soul engine. It combines Event Sourcing, multi-modal streaming, WASM sandboxing, and Cloudflare Durable Objects to build a neuromorphic pet symbiosis platform. The core innovation is **Trait Drift** — pet personalities evolve irreversibly based on interactions, stored as vectors in Qdrant rather than rows in a relational DB.

## Quick Start

```bash
cp .env.example .env              # then edit .env with your keys
docker compose up -d --build      # PostgreSQL, Redis, backend, frontend
```

Services: Backend API at `localhost:8000`, Swagger at `localhost:8000/docs`, Frontend at `localhost:3000`.

## Commands

### Docker
```bash
docker compose up -d --build                      # full stack
docker compose --profile tunnel up -d             # with Cloudflare Tunnel
docker compose logs -f backend                    # follow backend logs
docker compose exec backend python3 <script.py>    # run inside backend container
```

### Backend (Python/FastAPI, Python 3.13)
```bash
cd backend
pip install -r requirements.txt                   # first time

uvicorn main:app --host 0.0.0.0 --port 8000 --reload  # dev server

python -m pytest tests/ -v --tb=short --cov=.. --cov-report=term-missing  # all tests
python -m pytest tests/test_auth.py -v --tb=short       # single test file
python -m pytest tests/test_auth.py::test_login -v      # single test function

# Lint (targets only .py files to avoid node_modules)
black --check --diff $(find . -name '*.py' -not -path './.*')
isort --check-only --diff $(find . -name '*.py' -not -path './.*')
mypy . --install-types --non-interactive
bandit -r .
```

### Frontend (Next.js 14)
```bash
cd frontend
npm install                               # first time
npm run dev                               # dev server on :3000
npm run build                             # production build
npm run lint                              # ESLint
npm run type-check                        # tsc --noEmit
npm test                                  # Jest (config: __tests__/utils/jest.config.js)
npm run test:ci                           # Jest with coverage
npx playwright test                       # E2E tests
```

### CI/CD
GitHub Actions (`.github/workflows/`): Black + isort + Pylint + mypy + Bandit + pytest for backend; ESLint + tsc + npm audit + Jest for frontend; CodeQL + Trivy for security.

## Architecture (7-Layer)

```
Interaction → Redis Stream (event) → Qdrant (vector memory) → LLM (trait drift)
→ Redis Hash (real-time personality) → WebSocket → Frontend
```

1. **Edge Layer** (`edge-workers/`) — Cloudflare Durable Objects (PuppyBrainDO) for low-latency global pet state, WebSocket streaming. Configured via `wrangler.toml` with `PUPPY_BRAIN` binding pointing back to the Forge API.
2. **Frontend** (`frontend/`) — Next.js 14 App Router, Three.js 3D SoulRadar, Zustand state, client-side PuppySwarm agents. PWA via Serwist (service worker at `app/sw.ts`, config in `pwa-cache-config.js`).
3. **API Gateway** (`backend/main.py`) — FastAPI with JWT auth (HS256), slowapi rate limiting, CORS, security headers. Routes registered via `API_V1_PREFIX` (default `/api/v1`).
4. **AI Swarm** (`backend/agents/`) — 9 agents orchestrated via LangGraph in `backend/orchestrator.py`: Diagnosis, Vision, Growth, Prediction, Rebel, MemoryWeaver, TraitDrift, Memory, and a separate `backend/agents/orchestrator.py` for swarm-level logic. Each agent wraps litellm with tenacity retry (`base_agent.py`).
5. **Neuromorphic Engine** (`backend/core/neuromorphic_engine.py`) — Event Sourcing via Redis Streams, vector memory in Qdrant, LLM-computed Trait Drift on 4 axes: trust, neuroticism, energy, attachment.
6. **Forge Pipeline** (`backend/forge/pipeline.py`) — 4-stage asset generation: Prompt Alchemy → Parallel Forging → Adversarial VLM Validation → Crystallize to Qdrant.
7. **Security & Data** — Zero-Trust Gateway (Redis Lua atomic compute-quota deduction), WASM sandbox (`backend/core/wasm_sandbox.py` + `backend/sandbox/wasm_brain.py` using Wasmtime + Fuel Metering), PostgreSQL via SQLModel + async SQLAlchemy, Supabase (immutable SHA256-chained health logs with RLS), Qdrant, Redis.

## Directory Layout

### Backend (`backend/`)
- `main.py` — FastAPI entry, route registration, middleware, CORS
- `config.py` — Pydantic Settings, use `get_settings()` singleton (never `os.getenv()`)
- `database.py` — Async SQLAlchemy engine/session factory
- `auth.py` — JWT auth (HS256), OAuth (Google, GitHub), login/register/login endpoints
- `orchestrator.py` — LangGraph SoulOrchestrator (top-level agent orchestration)
- `agents/` — Individual agent implementations using `base_agent.py` (litellm + tenacity)
- `core/` — `neuromorphic_engine.py` (Redis Streams + Qdrant + Trait Drift), `wasm_sandbox.py`
- `forge/pipeline.py` — Asset generation pipeline
- `gateway/multimodal_ws.py` — Multimodal WebSocket (zero-copy vision, token-to-audio, barge-in, frame queue `maxsize=2`)
- `models/` — SQLModel schemas: `auth.py` (User), `soul.py` (PuppySoul), `interaction.py` (Interaction), `diagnosis.py` (DiagnosisRecord), `base.py` (IdMixin, TimestampMixin), `models.py` (legacy models)
- `security/zero_trust_gateway.py` — Atomic Redis Lua compute-quota deduction (cost tiers: forge=5000, interact=50, websocket=10)
- `sandbox/wasm_brain.py` — WASM runtime for UGC
- `observability/neural_probes.py` — OpenTelemetry probes
- `vision/soul_diagnosis.py` — Visual diagnosis service
- `tasks/swarm_tasks.py` — Celery background tasks (configured via `celery_app.py`)
- `tests/` — pytest suite (asyncio_mode=auto, defined in `pyproject.toml`)
- `Dockerfile.backend` — Python 3.13-slim image

### Frontend (`frontend/`)
- `app/` — Next.js App Router pages (`page.tsx`, `layout.tsx`, `providers.tsx`, `not-found.tsx`, `manifest.ts`, `sw.ts`)
- `components/` — React components: SoulRadar (Three.js 3D), DiagnosisModule, AuthModal, EvolutionArena, RebelPanel, SwarmDashboard, VisionAnalyzer, PWAInitializer, etc.
- `ai-agents/` — Client-side agent swarm (types, swarm-orchestrator, agent classes)
- `store/` — Zustand store (`usePuppyStore`)
- `hooks/` — `useAuth`, `usePuppySoul`, `useSoulWebSocket`
- `lib/` — Two API clients: `api.ts` (puppyAPI — core interactions, soul, evolution) and `api-client.ts` (generic API client). Also: `auth.ts`, `db.ts`, `petDB.ts`, `diagnosis.ts`, `vision.ts`, `grok-prompts.ts`, `websocket-client.ts`, `soul-websocket.ts`, `vision-analyzer.ts`
- `type/` — TypeScript type definitions (`auth.ts`, `global.d.ts`)
- `utils/trait-drift.ts` — Client-side trait drift computation
- `__tests__/utils/jest.config.js` — Jest config
- `next.config.js` — Next.js config with Serwist PWA integration
- `pwa-cache-config.js` — PWA caching strategy

### Edge Workers (`edge-workers/`)
- `wrangler.toml` — Cloudflare Workers config with `PuppyBrain` Durable Object binding
- `src/` — Worker source code
- `api/` — API route handlers
- `functions/` — Cloudflare Pages functions

### Reference Documentation (`docs/`)
- `ARCHITECTURE.md` — Full architecture design
- `DETAILED_DESIGN.md` — Detailed system design
- `DEPLOYMENT.md` — Multi-machine deployment guide (frontend/backend separation)
- `LoginOauth.md` — OAuth login test documentation
- `CI-Test.md` — CI test documentation
- `About.md` — Project about page
- `核心功能模块.csv` — Core feature module mapping

## Key Patterns

- **Config**: Always `get_settings()` from `backend/config.py`. Never `os.getenv()`. Use `safe_int_env()` / `safe_float_env()` for numeric env vars.
- **Database**: Async SQLAlchemy via `database.py`. DI: `get_db` / `get_async_session`. No Alembic — models use SQLModel with `create_all` pattern.
- **LLM calls**: Route through `base_agent.py` (litellm + tenacity retry). Never call provider APIs directly. Supported providers: OpenAI, Anthropic, Ollama (configured via `LLM_PROVIDER` env var).
- **Compute quota**: Every LLM operation must go through `backend/security/zero_trust_gateway.py` for atomic Redis Lua quota deduction.
- **WebSocket**: Use `backend/gateway/multimodal_ws.py`. Frame queue uses `maxsize=2` to drop stale frames.
- **Frontend API**: Two clients exist — `lib/api.ts` (puppyAPI object, legacy/core) and `lib/api-client.ts` (generic fetch-based client). API base URL from `NEXT_PUBLIC_API_URL`.
- **Frontend state**: Zustand store at `store/usePuppyStore.ts` — use this for global pet/soul state.
- **Frontend PWA**: Serwist-based service worker. Configured via `next.config.js` (serwist plugin) and `pwa-cache-config.js`. SW entry at `app/sw.ts`.
- **Frontend path aliases**: `@/` maps to `frontend/` root (tsconfig.json).
- **Testing**: Backend pytest with `asyncio_mode=auto`. No Alembic — models tested directly via SQLModel.
- **Docker**: Single `docker-compose.yml` for all services + optional `cloudflare-tunnel` service under `tunnel` profile. Frontend `NEXT_PUBLIC_*` vars must be passed as Docker build args.
