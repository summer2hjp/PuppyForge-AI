# PuppyForge AI Architecture

> 详细设计请参考：[`docs/DETAILED_DESIGN.md`](./DETAILED_DESIGN.md)

## 整体架构
- Frontend: Next.js 15 + Tailwind + shadcn/ui
- Backend: FastAPI (Python) + Grok API
- AI: Multi-agent system with LangGraph
- Database: Supabase / PostgreSQL + pgvector

## 核心Agent
1. DiagnosisAgent
2. PredictionAgent
3. NutritionAgent
4. BehaviorAgent

PuppyForge-AI/
├── README.md                     # 赛博朋克叛逆宣传主文档
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml            # 全家桶启动（最重要）
├── start-rebel.sh                # 一键狂暴启动脚本
├── requirements.txt
├── pyproject.toml
├── alembic.ini                   # 数据库迁移

├── backend/                      # 后端核心（FastAPI + 叛逆引擎）
│   ├── __init__.py
│   ├── main.py                   # FastAPI 入口 + 路由
│   ├── config.py
│   ├── database.py               # PostgreSQL + pgvector
│   ├── models.py                 # SQLAlchemy 模型 (User, PuppyMemory 等)
│   ├── auth.py                   # JWT + FastAPI-Users
│   ├── celery_app.py             # 异步叛逆任务队列
│   ├── evolution.py              # Self-Evolution Loop 核心
│   ├── agents/                   # 狗群 Agent 模块
│   │   ├── __init__.py
│   │   ├── base_agent.py
│   │   ├── rebellious_agent.py   # 叛逆狗
│   │   ├── diagnosis_agent.py    # 灵魂诊断
│   │   ├── prediction_agent.py
│   │   ├── growth_agent.py
│   │   └── orchestrator.py       # Swarm 指挥官
│   ├── tasks/                    # Celery 任务
│   │   ├── __init__.py
│   │   ├── swarm_tasks.py
│   │   └── mutual_rebel.py       # 互撕任务
│   ├── vision/                   # 视觉诊断模块
│   │   └── soul_diagnosis.py
│   └── utils/
│       ├── memory.py
│       └── rebellion_utils.py

├── frontend/                     # Next.js 14 前端（赛博朋克风格）
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 主仪表盘
│   │   ├── swarm/
│   │   │   └── page.tsx          # Swarm 实时面板
│   │   ├── diagnose/
│   │   │   └── page.tsx          # 照片灵魂诊断
│   │   ├── evolution/
│   │   │   └── page.tsx          # 进化竞技场
│   │   └── api/                  # Next.js API Routes（可选）
│   ├── components/
│   │   ├── SwarmDashboard.tsx
│   │   ├── VisionDiagnoser.tsx
│   │   ├── RebelliousChat.tsx
│   │   ├── EvolutionArena.tsx
│   │   ├── MutualRebelCanvas.tsx # 互撕动画 Canvas
│   │   ├── PuppyCard.tsx
│   │   └── ui/                   # shadcn/ui 组件
│   ├── lib/
│   │   └── api.ts                # 前端调用后端
│   ├── public/
│   │   ├── assets/
│   │   └── puppies/              # 狗狗图标/图片
│   ├── styles/
│   │   └── globals.css           # 霓虹赛博主题
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json

├── migrations/                   # Alembic 数据库迁移
│   └── versions/

├── docs/
│   └── architecture.md

├── scripts/
│   └── seed_data.py              # 初始化测试狗群数据

└── tests/
    ├── backend/
    └── frontend/
