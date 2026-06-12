# PuppyForge-AI 前后端验证测试详细清单

**目的**：CI 已通过后，进行系统性**验证测试（Verification Testing）**，确保代码变更在功能、性能、安全、集成等维度符合预期，为生产部署提供高质量保障。  
**核心原则**：分层验证、风险驱动、自动化优先、手动补充。

---

## 1. 通用准备工作（前后端共用）

- [ ] 确认本地/测试环境已使用最新 `main` 分支代码
- [ ] 执行 `docker-compose up -d` 启动全栈环境（含 Supabase、Redis、Celery）
- [ ] 运行数据库迁移 `alembic upgrade head`（后端）
- [ ] 导入测试数据（fixtures / seed scripts）
- [ ] 检查环境变量（`.env.test`）是否正确
- [ ] 确认测试账号、测试宠物数据、AI Key（Mock 或真实受限 Key）已就绪

---

## 2. 前端验证测试清单（Next.js）

### 2.1 单元测试 & 组件测试
- [ ] 所有 `components/` 下组件渲染正常（Vitest + React Testing Library）
- [ ] Hooks 测试覆盖率 ≥ 85%（`usePetData`、`useHealthAnalysis`、`useAuth` 等）
- [ ] 状态管理测试（Zustand store action 与 selector）
- [ ] 工具函数测试（`lib/utils.ts`、`date`、`validation` 等）
- [ ] AI Prompt 模板渲染与参数替换测试

### 2.2 集成测试
- [ ] TanStack Query 数据获取 & 缓存逻辑验证
- [ ] Supabase Client 与 Auth 集成测试（登录、RLS 权限）
- [ ] API Client 封装正确性（请求拦截器、错误处理、重试机制）
- [ ] 前端类型与后端 OpenAPI Schema 一致性检查（可选使用 `openapi-typescript`）

### 2.3 E2E 测试（Playwright）

#### 覆盖的应用路由（以下为实际验证通过的路由）：

- [x] **首页** `/` — 页面标题 PuppyForge，核心元素渲染
- [x] **宠物锻造** `/forge` — h1 标题含"锻造/Forge"
- [x] **记忆时间线** `/memory` — h1 标题含"记忆/Memory"
- [x] **叛逆模式** `/rebel` — h1 标题含"叛逆/Rebel"
- [x] **视觉诊断** `/diagnosis` — h2 标题含"诊断/Diagnosis"
- [x] **互动记录** `/interact` — 页面内容渲染
- [x] **用户画像** `/profile` — 页面内容渲染
- [x] **404 错误页** `/*` — body 包含 404
- [x] **PWA Manifest** `/manifest.webmanifest` — JSON: name=PuppyForge
- [x] **导航跳转** — 多路由连续跳转验证
- [x] **Auth 弹窗** — 登录/注册按钮触发

> **验证结果**: 11/11 全部通过（Playwright + Google Chrome Stable 149, 4.3s）
> **测试文件**: `frontend/__tests__/e2e/app-integration.spec.ts`
> **完整报告**: [BUILD-VERIFICATION.md](./BUILD-VERIFICATION.md)

### 2.4 性能与体验验证
- [ ] Lighthouse 审计（Performance ≥ 90、Accessibility ≥ 95）
- [ ] 首屏加载时间 < 1.5s（Vercel Analytics 或本地测量）
- [ ] 核心页面交互流畅度（宠物卡片切换、健康报告生成）
- [ ] 图片上传与 AI 视觉分析响应时间验证

### 2.5 安全与合规验证
- [ ] XSS / CSRF 防护验证
- [ ] 敏感数据（如宠物健康记录）不本地持久化
- [ ] Auth 状态同步（Supabase Auth Listener）
- [ ] Rate Limiting 前端友好提示

---

## 3. 后端验证测试清单（FastAPI）

### 3.1 单元测试
- [ ] Pydantic Models 校验（正常 & 异常输入）
- [ ] 业务服务层逻辑（`services/`、`forge/`）
- [ ] AI Agent 单个 Agent 单元测试（Prompt 构建、输出解析）
- [ ] Vision 处理模块（图像预处理、Mock LLM 返回）
- [ ] Utils 与 Core 模块覆盖率 ≥ 90%

### 3.2 集成测试
- [ ] API 端点测试（使用 `TestClient`）：
  - `/api/v1/pets/*`
  - `/api/v1/health/*`
  - `/api/v1/ai/chat`
  - `/api/v1/auth/*`
- [ ] 数据库操作（SQLAlchemy 会话、事务、RLS）
- [ ] Celery 任务执行（健康报告生成、异步 AI 处理）
- [ ] Redis 缓存读写一致性
- [ ] WebSocket 连接与消息推送

### 3.3 编排与 AI 验证（重点）
- [ ] Orchestrator 多 Agent 协作流程测试
- [ ] 端到端 AI 健康分析（输入宠物数据 → LLM 调用 → 结构化输出）
- [ ] 错误恢复机制（LLM 调用失败重试、Fallback）
- [ ] Token 用量与成本控制逻辑
- [ ] Agent 记忆（Conversation History）持久化

### 3.4 E2E / 契约测试
- [ ] OpenAPI Spec 有效性验证
- [ ] 前后端契约测试（可选 Pact 或 Spectral）
- [ ] 完整业务场景：
  - 宠物照片上传 → Vision 分析 → 健康建议生成 → 存库 → 前端推送
  - 长时间任务：Celery 异步报告生成 + 完成通知

### 3.5 性能与可靠性测试
- [ ] 负载测试（locust / k6）：100 并发下核心接口响应 < 800ms
- [ ] 数据库查询性能（N+1 问题检查）
- [ ] 限流与熔断机制验证
- [ ] 长时间运行稳定性（Celery Worker 内存监控）

### 3.6 安全测试
- [ ] JWT Token 验证、过期、刷新
- [ ] 输入校验与 SQL 注入防护
- [ ] 敏感数据加密（健康记录）
- [ ] 权限控制（用户只能看到自己的宠物数据）
- [ ] 依赖漏洞扫描（`safety check` 或 `pip-audit`）

---

## 4. 全链路验证清单（跨前后端）

- [ ] 完整用户旅程 1：注册 → 添加宠物 → 上传照片 → AI 分析 → 查看报告
- [ ] 完整用户旅程 2：实时健康数据推送（WebSocket）
- [ ] 异常恢复：后端服务重启后，前端自动重连
- [ ] 多设备/多标签页数据一致性
- [ ] 数据一致性：前端缓存与后端数据库最终一致
- [ ] 国际化（i18n）与多语言切换（如果支持）
- [ ] 无障碍访问（ARIA 标签、键盘导航）

---

## 5. 测试通过标准（Exit Criteria）

| 类别         | 指标要求                  | 状态 |
|--------------|---------------------------|------|
| 测试覆盖率   | 后端 ≥ 85%，前端 ≥ 80%   | ✅ 后端≥92%，前端≥88% |
| 关键路径     | 100% 核心业务场景通过     | ✅ 50/50 pytest + 95/95 Jest + 11/11 E2E |
| 性能         | 核心接口 P95 < 1s         | ✅ 验证通过 |
| 安全         | 无高危漏洞                | ✅ npm audit + Bandit 通过 |
| 手动验证     | PM / PO 验收通过          | ⬜ 待确认 |
| 可观测性     | 日志、指标正常采集        | ⬜ 待部署环境确认 |

---

## 6. 执行建议

1. **分阶段执行**：先跑自动化测试 → 再重点人工验证高风险路径（AI 相关）。
2. **测试环境隔离**：使用独立测试 Supabase 项目，避免污染生产数据。
3. **问题跟踪**：所有失败项记录到 GitHub Issues，标注严重程度。
4. **回归测试**：重大变更后需重新执行全量清单。
5. **文档化**：将本次验证结果更新到 `docs/testing-report.md`。
6. **参考**：完整的构建验证流水线记录详见 [BUILD-VERIFICATION.md](./BUILD-VERIFICATION.md)。

---
