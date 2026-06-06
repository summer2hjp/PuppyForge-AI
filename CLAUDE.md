# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuppyForge-AI is an AI-native pet soul engine. It combines Event Sourcing, multi-modal streaming, WASM sandboxing, and Cloudflare Durable Objects to build a neuromorphic pet symbiosis platform. The core innovation is **Trait Drift** — pet personalities evolve irreversibly based on interactions, stored as vectors in Qdrant rather than rows in a relational DB.

## Commands

### Docker (full stack)
```bash
cp .env.example .env                                   # first time only
docker compose up -d --build                           # all services (PostgreSQL, Redis, backend, frontend)
docker compose logs -f backend                         # follow backend logs
```

### Backend (Python/FastAPI)
```bash
cd backend
# Dev server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Tests
python -m pytest tests/ -v --tb=short --cov=. --cov-report=term-missing
# Lint
black --check --diff . && isort --check-only --diff . && pylint $(git ls-files '*.py')
# Type check
mypy . --install-types --non-interactive
# Security
bandit -r .
```

### Frontend (Next.js 14)
```bash
cd frontend
npm run dev               # dev server on :3000
npm run build             # production build
npm run lint              # ESLint
npm run type-check        # tsc --noEmit
npm test                  # Jest
npm run test:ci           # Jest with coverage
npx playwright test       # E2E tests
```

### CI/CD
CI runs via GitHub Actions (`.github/workflows/`): Black + isort + Pylint + mypy + Bandit + pytest for backend; ESLint + tsc + npm audit + Jest for frontend; CodeQL + Trivy for security.

## Architecture

The system is a **7-layer architecture**:

1. **Edge Layer** (`edge-workers/`) — Cloudflare Durable Objects (PuppyBrainDO) for low-latency global pet state and WebSocket streaming
2. **Frontend** (`frontend/`) — Next.js 14 App Router, Three.js 3D SoulRadar, Zustand state, client-side PuppySwarm agents
3. **API Gateway** (`backend/main.py`) — FastAPI with JWT auth (RS256), slowapi rate limiting, CORS, security headers
4. **AI Swarm** (`backend/agents/`, `backend/orchestrator.py`) — 9 agents (Diagnosis, Vision, Growth, Prediction, Rebel, MemoryWeaver, TraitDrift, etc.) orchestrated via LangGraph with parallel branching
5. **Neuromorphic Engine** (`backend/core/neuromorphic_engine.py`) — Event Sourcing via Redis Streams, vector memory in Qdrant, LLM-computed Trait Drift on 4 personality axes: trust, neuroticism, energy, attachment
6. **Forge Pipeline** (`backend/forge/pipeline.py`) — 4-stage asset generation: Prompt Alchemy → Parallel Forging → Adversarial VLM Validation → Crystallize to Qdrant
7. **Security & Data** — Zero-Trust Gateway (Redis Lua atomic compute-quota deduction), WASM sandbox (Wasmtime + Fuel Metering for UGC), PostgreSQL (SQLModel), Supabase (immutable SHA256-chained health logs with RLS), Qdrant, Redis

### Key data flow
```
Interaction → Redis Stream (event) → Qdrant (vector memory) → LLM (trait drift)
→ Redis Hash (real-time personality) → WebSocket → Frontend
```

### Backend directory layout
- `backend/main.py` — FastAPI app entry, route registration, middleware
- `backend/config.py` — Pydantic Settings, loaded from `.env`, use `get_settings()` for singleton access
- `backend/database.py` — Async SQLAlchemy engine/session
- `backend/auth.py` — JWT creation/verification, OAuth (Google, GitHub), login/register endpoints
- `backend/orchestrator.py` — LangGraph SoulOrchestrator with parallel agent nodes
- `backend/agents/` — Agent implementations using `base_agent.py` (litellm + tenacity retry)
- `backend/core/` — Neuromorphic engine + WASM sandbox
- `backend/forge/` — Asset generation pipeline
- `backend/gateway/` — Multimodal WebSocket (zero-copy vision, token-to-audio, barge-in)
- `backend/vision/` — Visual diagnosis service
- `backend/security/` — Zero-Trust compute gateway
- `backend/observability/` — OpenTelemetry neural probes
- `backend/models/` — SQLModel & Pydantic models
- `backend/tests/` — pytest test suite (asyncio_mode=auto)

### Frontend directory layout
- `frontend/app/` — Next.js App Router pages
- `frontend/components/` — React components (SoulRadar 3D, DiagnosisModule, AuthModal, etc.)
- `frontend/ai-agents/` — Client-side agent swarm (Diagnosis, Prediction, Growth, Rebel) + SwarmOrchestrator
- `frontend/store/` — Zustand store (`usePuppyStore`)
- `frontend/hooks/` — `useAuth`, `usePuppySoul`, `useSoulWebSocket`
- `frontend/lib/` — API client, auth helpers, WebSocket manager, diagnosis utilities
- `frontend/type/` — TypeScript type definitions

## Key Patterns

- **Config**: Always use `get_settings()` singleton from `backend/config.py`; never `os.getenv()` directly. Use `safe_int_env()` / `safe_float_env()` for numeric env vars.
- **Database**: Async SQLAlchemy via `database.py`. Use `get_db` / `get_async_session` dependency injection.
- **LLM calls**: Route through `base_agent.py` which wraps litellm with tenacity retry. Never call provider APIs directly.
- **WebSocket**: Use `backend/gateway/multimodal_ws.py` for real-time channels. Frame queue uses `maxsize=2` to drop stale frames.
- **Compute quota**: All LLM operations must go through the Zero-Trust Gateway (`backend/security/zero_trust_gateway.py`) for atomic Redis Lua quota deduction. Cost tiers: forge=5000, interact=50, websocket=10.
- **Frontend API calls**: Use the client from `frontend/lib/api.ts`. API base URL is `NEXT_PUBLIC_API_URL`.
- **Path aliases**: Frontend uses `@/` for `frontend/` root (configured in tsconfig.json).
- **Testing**: Backend pytest with `asyncio_mode=auto`; frontend uses Jest with `__tests__/utils/jest.config.js`.