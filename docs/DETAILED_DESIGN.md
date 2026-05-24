# PuppyForge-AI 项目详细设计方案

## 1. 目标与范围

- 面向宠物健康场景，提供“诊断 → 预测 → 干预建议 → 持续记忆”的 AI 闭环。
- 采用前后端分层 + 多 Agent 协作，支持快速 MVP 落地并保留后续扩展空间。
- 本方案覆盖当前仓库已实现模块与下一阶段落地接口，不包含商业化计费与运维平台实现细节。

## 2. 总体架构

### 2.1 架构分层

1. **前端层（Next.js 15 + React 19）**
   - 页面与可视化组件：`frontend/app`、`frontend/components`
   - 轻量 Agent 编排与类型系统：`frontend/ai-agents`
   - 视觉分析工具：`frontend/lib/vision-analyzer.ts`

2. **服务层（FastAPI）**
   - 入口与业务路由：`backend/main.py`（预留）
   - 多智能体与调度：`backend/agents/*`
   - 神经形态状态引擎：`backend/core/neuromorphic_engine.py`

3. **基础设施层**
   - Redis：事件流 + 配额控制
   - 向量存储（Qdrant）：长期记忆检索
   - 可观测性：`backend/observability/neural_probes.py`
   - 安全网关：`backend/security/zero_trust_gateway.py`

### 2.2 核心流程（逻辑主链路）

1. 用户上传宠物图片/描述（前端）
2. 前端触发视觉分析与 Agent 编排（诊断、预测、成长建议）
3. 后端接收互动事件写入 Redis Stream
4. 后台 Worker 生成 embedding 并写入 Qdrant
5. 基于近期记忆计算 trait drift，更新实时人格状态

## 3. 前端详细设计

### 3.1 页面与组件

- 主页面：`frontend/app/page.tsx`
  - 健康分、风险等级、快速诊断、趋势图、动态流
- 关键组件
  - `HealthScoreCard.tsx`：健康评分与趋势展示
  - `RiskRadar.tsx`：风险等级与干预窗口
  - `QuickDiagnose.tsx`：快速诊断入口
  - `NotificationToast.tsx`：提示反馈
  - `PuppyProfile.tsx`：宠物档案维护

### 3.2 Agent 编排

- 编排器：`frontend/ai-agents/core/swarm-orchestrator.ts`
  - 顺序执行：Diagnosis → Prediction → Growth → Rebel（可选）→ Memory Update
- 类型定义：`frontend/ai-agents/types.ts`
  - 统一输入输出结构，保障跨组件调用稳定

### 3.3 前端状态与交互

- 使用 React `useState` 管理页面核心状态（healthScore/riskLevel/predictions）。
- 视觉诊断回调触发状态更新与通知系统，保证“操作即反馈”。

## 4. 后端详细设计

### 4.1 神经形态引擎（核心）

文件：`backend/core/neuromorphic_engine.py`

- `POST /api/v1/interact`
  - 接收 `InteractionEvent`，写入 Redis Stream，快速返回 `event_id`
- `persona_mutator_worker`
  - 消费事件流，生成记忆 embedding，写入 Qdrant
  - 异步触发 `mutate_persona` 计算人格漂移
- `mutate_persona`
  - 检索最近记忆作为上下文，调用 LLM 输出 trait_drift
  - 将结果写入 Redis Hash（实时人格态）

### 4.2 多 Agent 服务

- `backend/agents/diagnosis_agent.py`：诊断逻辑
- `backend/agents/prediction_agent.py`：风险预测逻辑
- `backend/agents/growth_agent.py`：成长计划生成
- `backend/agents/orchestrator.py`：跨 Agent 调度（当前为扩展位）

### 4.3 安全与可观测

- 零信任网关：`backend/security/zero_trust_gateway.py`
  - JWT 鉴权 + Redis Lua 原子配额扣减
  - 按路径估算算力成本并进行超限拦截
- 神经探针：`backend/observability/neural_probes.py`
  - 链路追踪（思考周期）
  - Token 成本计量与 WASM 燃料消耗统计

### 4.4 Forge Pipeline（资产生成流水线）

文件：`backend/forge/pipeline.py`

基于 Temporal 的四阶段工作流：
1. Prompt 炼金（`alchemy_prompt`）
2. 并行锻造（`parallel_forging`）
3. 对抗质检（`adversarial_validation`）
4. 资产结晶（`crystallize_asset`）

## 5. 数据设计

### 5.1 事件模型

`InteractionEvent`：
- `puppy_id: str`
- `action: str`
- `context: str`

### 5.2 记忆数据

Qdrant payload 建议字段：
- `puppy_id`
- `memory`
- `timestamp`
- `source`（可选：vision/chat/system）

### 5.3 实时人格态

Redis Hash：`puppy_persona:{puppy_id}`
- `trust`
- `neuroticism`
- `energy`
- `attachment`

## 6. API 设计（MVP）

### 6.1 已定义/可直接实现

- `POST /api/v1/interact`：写入互动事件（已在核心引擎中定义）

### 6.2 建议补全

- `GET /api/v1/puppy/{id}/persona`：读取当前人格向量
- `GET /api/v1/puppy/{id}/memories`：分页查询长期记忆
- `POST /api/v1/diagnosis`：统一诊断入口（图像/文本）

## 7. 非功能设计

### 7.1 性能
- 事件摄入与推理计算解耦（同步返回 + 异步消费）
- 记忆检索限制 Top-K，避免上下文过大

### 7.2 安全
- 网关统一鉴权与配额控制
- 关键密钥改为环境变量注入（避免硬编码）

### 7.3 可维护性
- 前端统一类型定义，后端按模块拆分职责
- 文档与代码目录保持一一映射，减少认知成本

## 8. 迭代计划（建议）

### 里程碑 M1（可用）
- 打通前端诊断入口 + `/api/v1/interact`
- 完成事件入流与记忆写入

### 里程碑 M2（可观测）
- 接入 OTel 导出链路与指标
- 完成算力配额与告警策略

### 里程碑 M3（可扩展）
- 引入 Durable Objects/Edge WS 网关
- 完成 WASM UGC 沙箱与风控策略

## 9. 风险与应对

- **LLM 输出不稳定**：统一结构化输出约束 + 兜底解析
- **向量库规模增长快**：分层存储与定期归档
- **高并发算力超卖**：Lua 原子扣减 + 用户级限流
- **组件状态复杂化**：逐步引入集中状态管理（如 Zustand）
