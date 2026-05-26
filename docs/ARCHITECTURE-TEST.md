# PuppyForge-AI 测试架构文档（ARCHITECTURE-TEST.md）

## 1. 测试概述

**项目名称**：PuppyForge-AI  
**测试目标**：构建高覆盖率、可维护、自动化运行的测试体系，确保AI-Agent驱动的宠物灵魂锻造平台稳定性和可靠性。  
**测试原则**：
- 以系统测试为核心，单元测试为基础，E2E测试为最终验证
- 优先覆盖核心路径（Auth → Vision → Diagnosis → Memory → TraitDrift → AI-Agent编排）
- 强调错误处理、重试机制、优雅降级与安全性
- 100%自动化，集成GitHub Actions CI

**当前测试覆盖率目标**：Frontend ≥ 88%，Backend ≥ 92%（持续提升中）

---

## 2. 测试分层架构

### 2.1 单元测试（Unit Tests）
- **Frontend**：Jest + React Testing Library + node-mocks-http
- **Backend**：pytest + pytest-asyncio + httpx + pytest-mock

**已覆盖模块**（最新更新）：
- **Auth模块**：login / register / refresh
- **Vision & Diagnosis模块**
- **RadarMesh 3D灵魂雷达组件**
- **Trait漂移计算工具**
- **Soul WebSocket实时交互**
- **AI-Agent各独立Agent**（VisionAgent、DiagnosisAgent、MemoryAgent、TraitDriftAgent）
- **性能测试模块**
- **安全测试模块**

---

### 2.2 集成测试（Integration Tests）
- Auth + Diagnosis 完整流程集成
- AI-Agent多代理编排集成
- 前后端API契约测试

---

### 2.3 系统测试（System Tests）
- 全链路AI-Agent诊断流程
- 实时WebSocket灵魂状态更新
- 错误处理与降级策略（网络超时、部分失败、全失败）
- 性能与并发测试

---

### 2.4 E2E测试（End-to-End）
- **框架**：Playwright
- **核心场景**：认证流程、AI诊断流程、错误重试流程、PetMemory管理

---

## 3. 测试文件结构（最新更新）

```bash
frontend/
├── __tests__/
│   ├── api/auth/                  # login, register, refresh
│   ├── components/                # VisionAnalyzer, DiagnosisModule, RadarMesh, PuppyProfile...
│   ├── lib/                       # diagnosis, soul-websocket, vision
│   ├── utils/                     # trait-drift
│   ├── integration/               # auth-diagnosis-flow.test.ts
│   └── e2e/                       # login-flow, vision-diagnosis-flow, ai-agent-*, ai-agent-error-flow
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
│   ├── test_orchestrator.py
│   ├── test_performance.py        # 新增：性能测试
│   ├── test_security.py           # 新增：安全测试
│   └── test_main.py
│
docs/
└── ARCHITECTURE-TEST.md           # 本文档
│
.github/workflows/
└── ci-test.yml                    # Jest + pytest 自动化流水线

**🚀 系统测试 / 测试用例 / 单元测试 完整交付报告**

**测试对象**：`docs/ARCHITECTURE-TEST.md`（更新版）  
**测试分支**：`feature/update-test-architecture-doc`（已从main创建）  
**状态**：**测试架构文档已更新并纳入所有新模块** ✅

---

### **docs/ARCHITECTURE-TEST.md 完整更新版代码**

```markdown
# PuppyForge-AI 测试架构文档（ARCHITECTURE-TEST.md）

## 1. 测试概述

**项目名称**：PuppyForge-AI  
**测试目标**：构建高覆盖率、可维护、自动化运行的测试体系，确保AI-Agent驱动的宠物灵魂锻造平台稳定性和可靠性。  
**测试原则**：
- 以系统测试为核心，单元测试为基础，E2E测试为最终验证
- 优先覆盖核心路径（Auth → Vision → Diagnosis → Memory → TraitDrift → AI-Agent编排）
- 强调错误处理、重试机制、优雅降级与安全性
- 100%自动化，集成GitHub Actions CI

**当前测试覆盖率目标**：Frontend ≥ 88%，Backend ≥ 92%（持续提升中）

---

## 2. 测试分层架构

### 2.1 单元测试（Unit Tests）
- **Frontend**：Jest + React Testing Library + node-mocks-http
- **Backend**：pytest + pytest-asyncio + httpx + pytest-mock

**已覆盖模块**（最新更新）：
- **Auth模块**：login / register / refresh
- **Vision & Diagnosis模块**
- **RadarMesh 3D灵魂雷达组件**
- **Trait漂移计算工具**
- **Soul WebSocket实时交互**
- **AI-Agent各独立Agent**（VisionAgent、DiagnosisAgent、MemoryAgent、TraitDriftAgent）
- **性能测试模块**
- **安全测试模块**

---

### 2.2 集成测试（Integration Tests）
- Auth + Diagnosis 完整流程集成
- AI-Agent多代理编排集成
- 前后端API契约测试

---

### 2.3 系统测试（System Tests）
- 全链路AI-Agent诊断流程
- 实时WebSocket灵魂状态更新
- 错误处理与降级策略（网络超时、部分失败、全失败）
- 性能与并发测试

---

### 2.4 E2E测试（End-to-End）
- **框架**：Playwright
- **核心场景**：认证流程、AI诊断流程、错误重试流程、PetMemory管理

---

## 3. 测试文件结构（最新更新）

```bash
frontend/
├── __tests__/
│   ├── api/auth/                  # login, register, refresh
│   ├── components/                # VisionAnalyzer, DiagnosisModule, RadarMesh, PuppyProfile...
│   ├── lib/                       # diagnosis, soul-websocket, vision
│   ├── utils/                     # trait-drift
│   ├── integration/               # auth-diagnosis-flow.test.ts
│   └── e2e/                       # login-flow, vision-diagnosis-flow, ai-agent-*, ai-agent-error-flow
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
│   ├── test_orchestrator.py
│   ├── test_performance.py        # 新增：性能测试
│   ├── test_security.py           # 新增：安全测试
│   └── test_main.py
│
docs/
└── ARCHITECTURE-TEST.md           # 本文档
│
.github/workflows/
└── ci-test.yml                    # Jest + pytest 自动化流水线
```

---

## 4. 关键测试用例清单（最新更新）

### 4.1 新增 - RadarMesh 3D组件测试
- 正常trait渲染与动画更新
- 空数据与极端值边界处理

### 4.2 新增 - 性能测试（test_performance.py）
- 单次诊断耗时控制（< 3秒）
- 并发诊断压力测试（10并发）

### 4.3 新增 - 安全测试（test_security.py）
- SQL注入防护
- JWT Token验证（无效、过期）
- 请求频率限制（Rate Limiting）

### 4.4 AI-Agent错误处理（已优化）
- 网络超时 + 重试机制
- 部分Agent失败降级
- 完全崩溃安全兜底
- 非法输入处理

### 4.5 核心业务测试
- Auth全场景（400/401/409/500）
- Vision → Diagnosis → TraitDrift 全链路
- PetMemory嵌入与影响验证

---

## 5. CI/CD测试流水线

- **触发条件**：`push` 到 main/develop + `pull_request`
- **阶段**：
  1. Frontend Jest测试 + 覆盖率
  2. Backend pytest测试 + 覆盖率（含性能、安全模块）
  3. Playwright E2E测试
- **失败策略**：测试不通过时自动Block PR合并

---

## 6. 测试运行命令

```bash
# Frontend
cd frontend
npm test                                      # 全部单元测试
npx playwright test                           # E2E测试

# Backend
cd backend
pytest tests/ -v --cov                        # 全部测试
pytest tests/test_performance.py -v           # 性能测试
pytest tests/test_security.py -v              # 安全测试
```

---

## 7. 测试策略与最佳实践

1. **Arrange-Act-Assert** + **Mock外部依赖**
2. **边界值、异常场景、性能、安全** 必须覆盖
3. **测试数据**：`public/test-assets/puppy-test.jpg`
4. **持续监控**：覆盖率低于阈值时CI失败
5. **TDD流程**：新功能先写测试再实现

---
