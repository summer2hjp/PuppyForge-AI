# PuppyForge-AI 测试架构文档（ARCHITECTURE-TEST.md）

## 1. 测试概述

**项目名称**：PuppyForge-AI  
**测试目标**：构建高覆盖率、可维护、自动化运行的测试体系，确保AI-Agent驱动的宠物灵魂锻造平台稳定性和可靠性。  
**测试原则**：
- 以系统测试为核心，单元测试为基础，E2E测试为验证
- 优先覆盖核心路径（Auth → Vision → Diagnosis → Memory → TraitDrift）
- 强调错误处理与优雅降级
- 100%自动化，集成GitHub Actions CI

**当前测试覆盖率目标**：Frontend ≥ 85%，Backend ≥ 90%（持续提升中）

---

## 2. 测试分层架构

### 2.1 单元测试（Unit Tests）
- **Frontend**：Jest + React Testing Library + node-mocks-http
- **Backend**：pytest + pytest-asyncio + httpx

**已覆盖模块**：
- Auth（login / register / refresh）
- VisionAnalyzer & DiagnosisModule
- PuppySoul Trait漂移计算
- Soul WebSocket实时交互
- AI-Agent各独立Agent（VisionAgent、DiagnosisAgent、MemoryAgent、TraitDriftAgent）

---

### 2.2 集成测试（Integration Tests）
- 前后端API契约测试
- AI-Agent多代理编排测试（SwarmOrchestrator）
- 数据库 + 向量嵌入集成测试

---

### 2.3 系统测试（System Tests）
- 全链路诊断流程：图片上传 → 多Agent协作 → 灵魂报告生成 → Trait漂移预测
- 实时WebSocket灵魂状态更新
- 部分失败与完全失败场景下的系统行为

---

### 2.4 E2E测试（End-to-End）
- **框架**：Playwright
- **核心场景**：
  - 认证完整流程（注册→登录→仪表盘）
  - Vision + AI-Agent诊断全流程
  - 错误处理与重试流程
  - PetMemory添加与影响验证

---

## 3. 测试文件结构

```bash
frontend/
├── __tests__/
│   ├── api/auth/                  # login, register, refresh
│   ├── components/                # VisionAnalyzer, DiagnosisModule, PuppyProfile...
│   ├── lib/                       # diagnosis, soul-websocket, vision
│   ├── utils/                     # trait-drift
│   └── e2e/                       # login-flow, vision-diagnosis-flow, ai-agent-*
│
backend/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_ai_agent.py
│   ├── test_ai_agent_error_handling.py
│   ├── test_models.py
│   ├── test_vision.py
│   ├── test_diagnosis.py
│   └── test_orchestrator.py
│
.github/workflows/
└── ci-test.yml                    # Jest + pytest 自动化流水线
