# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuppyForge-AI is an AI-native pet soul engine — an Event-Sourcing, multi-modal streaming platform where pet personalities evolve irreversibly via **Trait Drift**, stored as vectors in Qdrant. Combines FastAPI backend, Next.js 14 frontend, LangGraph agent swarm, WASM sandboxing, and Cloudflare Durable Objects.

## Quick Start

```bash
cp .env.example .env              # then edit .env with your keys
docker compose up -d --build      # full stack (PostgreSQL, Redis, backend, frontend)
```

Services: Backend API at `localhost:8000`, Swagger at `localhost:8000/docs` (dev only), Frontend at `localhost:3000`.

## Commands

### Docker
```bash
docker compose up -d --build                       # full stack
docker compose --profile tunnel up -d              # with Cloudflare Tunnel
docker compose logs -f backend                     # follow backend logs
docker compose exec backend python3 <script.py>    # run inside backend container
docker compose --profile tunnel run cloudflared tunnel login  # initial tunnel setup
```

### Backend (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt               # first time

uvicorn main:app --host 0.0.0.0 --port 8000 --reload  # dev server

python -m pytest tests/ -v --tb=short --cov=. --cov-report=term-missing  # all tests
python -m pytest tests/test_auth.py -v --tb=short               # single test file
python -m pytest tests/test_auth.py::test_login -v              # single test function

# Lint — targets only .py files
black --check --diff $(find . -name '*.py' -not -path './.*')
isort --check-only --diff $(find . -name '*.py' -not -path './.*')
mypy --install-types --non-interactive $(find . -name '*.py' -not -path './.*')
bandit -r . -x .venv,__pycache__
```

### Frontend (Next.js 14)
```bash
cd frontend
npm install                               # first time
npm run dev                               # dev server on :3000
npm run build                             # production build (standalone output)
npm run lint                              # ESLint (next lint)
npm run type-check                        # tsc --noEmit
npm test                                  # Jest (config at __tests__/utils/jest.config.js)
npm run test:ci                           # Jest with coverage
npm run test:watch                        # Jest in watch mode
npx playwright test                       # E2E tests
```

### CI/CD
GitHub Actions (`.github/workflows/`): Black + isort + Pylint + mypy + Bandit + pytest for backend; ESLint + tsc + npm audit + Jest for frontend; CodeQL + Trivy for security.

## Architecture (7-Layer)

```
Interaction → Redis Stream (event) → Qdrant (vector memory) → LLM (trait drift)
→ Redis Hash (real-time personality) → WebSocket → Frontend
```

1. **Edge Layer** (`edge-workers/`) — Cloudflare Durable Objects (PuppyBrainDO) for low-latency global pet state, WebSocket streaming.
2. **Frontend** (`frontend/`) — Next.js 14 App Router, Three.js 3D SoulRadar, Zustand state, client-side PuppySwarm agents. PWA via custom service worker at `app/sw.ts`.
3. **API Gateway** (`backend/main.py`) — FastAPI with JWT auth (HS256), slowapi rate limiting, CORS, security headers. Routes at `/api/v1/{auth,vision,interact,soul,ws}`.
4. **AI Swarm** (`backend/agents/`) — 8 specialized agents (Diagnosis, Vision, Growth, Prediction, Rebel, MemoryWeaver, TraitDrift, Memory) orchestrated via LangGraph in both `backend/orchestrator.py` (top-level SoulOrchestrator) and `backend/agents/orchestrator.py` (swarm-level). Each agent wraps litellm with tenacity retry (`base_agent.py`). An older standalone implementation also lives in `backend/agents.py` (TraitDriftAgent, MemoryWeaver, ResponseGenerator).
5. **Neuromorphic Engine** (`backend/core/neuromorphic_engine.py`) — Event Sourcing via Redis Streams, vector memory in Qdrant, LLM-computed Trait Drift on 4 axes: trust, neuroticism, energy, attachment.
6. **Forge Pipeline** (`backend/forge/pipeline.py`) — 4-stage asset generation: Prompt Alchemy → Parallel Forging → Adversarial VLM Validation → Crystallize to Qdrant.
7. **Security & Data** — Zero-Trust Gateway (Redis Lua atomic compute-quota deduction), WASM sandbox (`backend/core/wasm_sandbox.py` + `backend/sandbox/wasm_brain.py` using Wasmtime + Fuel Metering), PostgreSQL via SQLModel + async SQLAlchemy, Supabase (immutable SHA256-chained health logs with RLS), Qdrant, Redis.

## Directory Layout

### Backend (`backend/`)
- `main.py` — FastAPI entry, route registration, middleware, CORS, lifespan
- `config.py` — Pydantic Settings, use `get_settings()` singleton (never `os.getenv()`)
- `database.py` — Async SQLAlchemy engine/session factory. Handles SQLite vs PostgreSQL engine params automatically. No Alembic — `init_db()` calls `SQLModel.metadata.create_all`.
- `auth.py` — JWT auth (HS256), OAuth (Google, GitHub), login/register endpoints
- `agents.py` — Legacy standalone agent implementations (TraitDriftAgent, MemoryWeaver, ResponseGenerator)
- `orchestrator.py` — LangGraph SoulOrchestrator (top-level agent orchestration)
- `dependencies.py` — FastAPI DI: `get_current_active_user`, `get_current_admin_user`
- **Route files** — `souls.py` (CRUD pet souls), `interactions.py` (interaction history), `websocket.py` (WebSocket ConnectionManager + `/ws/diagnosis/{user_id}`), `vision.py` (routed via `vision/__init__.py`)
- `agents/` — 8 agents using `base_agent.py` (litellm + tenacity), plus `orchestrator.py` for swarm logic
- `core/` — `neuromorphic_engine.py` (Redis Streams + Qdrant + Trait Drift), `wasm_sandbox.py`
- `forge/pipeline.py` — Asset generation pipeline
- `gateway/multimodal_ws.py` — Multimodal WebSocket (zero-copy vision, token-to-audio, barge-in, frame queue `maxsize=2`)
- `models/` — SQLModel schemas: `auth.py` (User), `soul.py` (PuppySoul), `interaction.py` (Interaction), `diagnosis.py` (DiagnosisRecord), `base.py` (IdMixin, TimestampMixin), `models.py` (legacy models)
- `security/zero_trust_gateway.py` — Atomic Redis Lua compute-quota deduction (cost tiers: forge=5000, interact=50, websocket=10)
- `sandbox/wasm_brain.py` — WASM runtime for UGC
- `observability/neural_probes.py` — OpenTelemetry probes
- `vision/` — `soul_diagnosis.py` (visual diagnosis service), `__init__.py` (router + `analyze_pet_image`)
- `tasks/` — Celery tasks (`swarm_tasks.py`), `mutual_rebel.p` (pickle data). Note: `celery_app.py` is a stub (0 bytes).
- `utils/` — `memory.py`, `rebellion_utils.py` (empty)
- `tests/` — pytest suite (asyncio_mode=auto in `pyproject.toml`)
- `test_auth_full.py` — Standalone auth integration test (runs via `python3 test_auth_full.py`, not pytest)
- `Dockerfile.backend` — Python 3.13-slim (used by docker-compose)
- `Dockerfile` — Alternative Python 3.11-slim-based Dockerfile (not used by docker-compose.yml)

### Frontend (`frontend/`)
- `app/` — Next.js App Router pages (`page.tsx`, `layout.tsx`, `providers.tsx`, `not-found.tsx`, `manifest.ts`, `sw.ts`)
- `components/` — SoulRadar (Three.js 3D), DiagnosisModule, AuthModal, EvolutionArena, RebelPanel, SwarmDashboard, VisionAnalyzer, PWAInitializer, etc.
- `ai-agents/` — Client-side agent swarm (types, swarm-orchestrator, agent classes with prompt templates)
- `store/` — Zustand store (`usePuppyStore`)
- `hooks/` — `useAuth`, `usePuppySoul`, `useSoulWebSocket`
- `lib/` — Two API clients: `api.ts` (puppyAPI — core interactions, soul, evolution) and `api-client.ts` (generic fetch-based). Also: `auth.ts`, `db.ts`, `petDB.ts`, `diagnosis.ts`, `vision.ts`, `grok-prompts.ts`, `websocket-client.ts`, `soul-websocket.ts`, `vision-analyzer.ts`
- `type/` — TypeScript type definitions (`auth.ts`, `global.d.ts`)
- `utils/trait-drift.ts` — Client-side trait drift computation
- `__tests__/` — `utils/jest.config.js` (Jest config), `components/` (unit tests), `e2e/` (Playwright specs), `integration/`, `api/`
- `next.config.js` — Next.js config, standalone output, security headers, Webpack fallbacks
- `tsconfig.json` — Path aliases: `@/` maps to `frontend/` root
- `pwa-cache-config.js` — PWA caching strategy (for reference; current PWA uses custom SW at `app/sw.ts`)
- `playwright.config.ts` — Playwright E2E config

### Edge Workers (`edge-workers/`)
- `wrangler.toml` — Cloudflare Workers config with PuppyBrain Durable Object binding
- `src/` — Worker source code
- `api/` — API route handlers
- `functions/` — Cloudflare Pages functions

## Key Patterns

- **Config**: Always `get_settings()` from `backend/config.py`. Never `os.getenv()`. Use `safe_int_env()` / `safe_float_env()` for numeric env vars.
- **Database**: Async SQLAlchemy via `database.py`, which auto-adapts between SQLite (`StaticPool`/`NullPool`) and PostgreSQL (`pool_size=10`, `pool_pre_ping=True`). DI: `get_db` / `get_db_context`. Schema auto-created via `init_db()` — no Alembic.
- **LLM calls**: Route through `base_agent.py` (litellm + tenacity retry). Never call provider APIs directly. Supported providers: OpenAI, Anthropic, Ollama (configured via `LLM_PROVIDER` env var).
- **Compute quota**: Every LLM operation must go through `backend/security/zero_trust_gateway.py` for atomic Redis Lua quota deduction.
- **WebSocket**: Two WS systems exist — `backend/websocket.py` (simple ConnectionManager for `/ws/diagnosis`) and `backend/gateway/multimodal_ws.py` (advanced: zero-copy vision, token-to-audio, barge-in, frame queue `maxsize=2`).
- **Frontend API**: Two clients — `lib/api.ts` (puppyAPI object, legacy/core) and `lib/api-client.ts` (generic fetch-based). API base URL from `NEXT_PUBLIC_API_URL`.
- **Frontend state**: Zustand store at `store/usePuppyStore.ts` for global pet/soul state.
- **Frontend PWA**: Hand-rolled service worker at `app/sw.ts` (not Serwist-managed). @serwist/next is in package.json but not currently wired in next.config.js. The `pwa-cache-config.js` file exists for future use.
- **Frontend path aliases**: `@/` maps to `frontend/` root (tsconfig.json).
- **Testing**: Backend pytest with `asyncio_mode=auto`. Models tested via SQLModel directly. Frontend uses Jest (config at `__tests__/utils/jest.config.js`) and Playwright (config at `playwright.config.ts`) for E2E.
- **Docker**: Single `docker-compose.yml` for all services + optional `cloudflare-tunnel` under `tunnel` profile. Frontend `NEXT_PUBLIC_*` vars must be passed as Docker build args. There's also a standalone `docker-compose.backend.yml` and `docker-compose.frontend.yml` in respective directories.
- **Backend Dockerfiles**: Two exist — `Dockerfile.backend` (Python 3.13-slim, used by docker-compose) and `Dockerfile` (Python 3.11-slim-bookworm, standalone). The docker-compose uses `Dockerfile.backend`.
- **Docker DNS workaround**: The docker-compose uses `--edge` flags for cloudflared to skip SRV DNS lookup, which fails with `systemd-resolved`. The compose also sets explicit DNS `192.168.3.222`.
