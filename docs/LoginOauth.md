# 登录 & OAuth 认证测试流程

> 本文档记录了 PuppyForge AI 认证系统的完整测试流程，包括本地密码登录和第三方 OAuth 登录（GitHub / Google）。

## 📋 测试范围

| 模块 | 测试项 | 数量 |
| :--- | :--- | :---: |
| 健康检查 | 后端服务在线 | 1 |
| 注册流程 | 正常注册 / 重复注册 / 空密码 / 短密码 | 5 |
| 登录流程 | 正确密码 / 错误密码 / 不存在用户 / 空密码 | 7 |
| 会话与授权 | `/me` / 无Token / 无效Token / 伪造Token / 登出 / Refresh | 7 |
| 第三方登录 | Google URL / GitHub 跳转 / Google Callback | 4 |
| 综合链路 | 注册→登出→重新登录→`/me` | 1 |
| **总计** | | **25** |

---

## 1. 架构

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  用户/前端   │ ──▶ │  Cloudflare  │ ──▶ │  FastAPI     │
│             │ ◀── │  Tunnel      │ ◀── │  Backend     │
└─────────────┘     └──────────────┘     └──────────────┘
       │                                       │
       │  OAuth 跳转                           │  PSQL / Redis
       ▼                                       ▼
┌─────────────┐                        ┌──────────────┐
│ GitHub /    │                        │ PostgreSQL   │
│ Google OAuth│                        │ Redis        │
└─────────────┘                        └──────────────┘
```

- **本地开发**：`localhost:8000`
- **生产/第三方回调**：`https://oauth.huangjp520.de5.net`（通过 Cloudflare Tunnel 转发至 `localhost:8000`）

---

## 2. 环境准备

### 2.1 配置文件

```bash
cp .env.example .env
```

关键配置项：

| 变量 | 说明 |
| :--- | :--- |
| `SECRET_KEY` | JWT 签名密钥 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App 凭据 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 凭据 |
| `GITHUB_REDIRECT_URI` | GitHub 回调 URL（生产: `https://oauth.huangjp520.de5.net/api/v1/auth/github/callback`） |
| `GOOGLE_REDIRECT_URI` | Google 回调 URL（生产: `https://oauth.huangjp520.de5.net/api/v1/auth/google/callback`） |
| `CF_TUNNEL_TOKEN` | Cloudflare Tunnel 令牌 |

### 2.2 启动服务

```bash
# 开发模式
docker compose up -d --build

# 生产模式（含 Cloudflare Tunnel）
docker compose --profile tunnel up -d --build
```

---

## 3. 本地密码登录测试

### 3.1 注册

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","full_name":"Test User"}'
```

**成功响应**（201）：
```json
{
  "user": {
    "email": "test@example.com",
    "role": "user",
    "is_active": true,
    "full_name": "Test User",
    "id": 38188260,
    "created_at": "2026-06-06T12:23:32.805951"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": null
}
```

### 3.2 登录

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

### 3.3 获取当前用户（需 Token）

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**响应**：
```json
{
  "id": 38188260,
  "email": "test@example.com",
  "role": "user",
  "is_active": true
}
```

### 3.4 错误场景

```bash
# 错误密码
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# → 401 {"detail":"邮箱或密码错误"}

# 不存在用户
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"unknown@example.com","password":"password"}'
# → 401 {"detail":"邮箱或密码错误"}（统一错误信息，不泄漏邮箱是否存在）

# 无效 Token
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token_here"
# → 401 {"detail":"无效凭证"}

# 重复注册
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
# → 400 {"detail":"该邮箱已被注册"}
```

### 3.5 登出

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer <YOUR_TOKEN>"
# → 200 {"message":"已成功登出"}
```

---

## 4. 第三方 OAuth 测试

### 4.1 Google 登录

```bash
# 获取 Google 授权 URL（建议浏览器打开）
curl https://oauth.huangjp520.de5.net/api/v1/auth/google/login
```

**响应**：
```json
{
  "url": "https://accounts.google.com/o/oauth2/auth?client_id=xxx&redirect_uri=https://oauth.huangjp520.de5.net/api/v1/auth/google/callback&response_type=code&scope=email profile"
}
```

浏览器打开该 URL → 跳转 Google 授权 → 用户同意 → 回调到后端。

### 4.2 GitHub 登录

```bash
# GitHub 登录入口（返回 307 重定向）
curl -v https://oauth.huangjp520.de5.net/api/v1/auth/github/login

# → Location: https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=...
```

浏览器访问该 URL → 跳转 GitHub 授权 → 用户同意 → 回调到后端。

### 4.3 OAuth 回调流程

```
用户点击「GitHub 登录」
  → GET /api/v1/auth/github/login
  → 307 重定向至 https://github.com/login/oauth/authorize
  → 用户授权
  → GitHub 302 重定向至回调 URL (带 code + state)
  → 后端用 code 换取 access_token
  → 调用 GitHub User API 获取用户信息
  → 查找或创建用户
  → 签发 JWT
  → 重定向至前端 /auth/callback#token=xxx&user={...}
```

### 4.4 配置第三方 OAuth

**GitHub**（https://github.com/settings/developers）：
| 字段 | 值 |
| :--- | :--- |
| Homepage URL | `https://home.huangjp520.de5.net` |
| Authorization callback URL | `https://oauth.huangjp520.de5.net/api/v1/auth/github/callback` |

**Google**（https://console.cloud.google.com/apis/credentials）：
| 字段 | 值 |
| :--- | :--- |
| Authorized JavaScript origins | `https://oauth.huangjp520.de5.net` |
| Authorized redirect URIs | `https://oauth.huangjp520.de5.net/api/v1/auth/google/callback` |

---

## 5. 自动化测试

### 5.1 运行全量测试脚本

测试脚本位于 `backend/test_auth_full.py`，需在容器内运行：

```bash
# 复制测试脚本到容器
docker cp backend/test_auth_full.py puppyforge-backend:/app/test_auth_full.py

# 运行测试
docker exec puppyforge-backend python3 /app/test_auth_full.py
```

**示例输出**：
```
=================================================================
  🐕 PuppyForge AI — 认证系统完整测试
=================================================================

📋 [1/6] 环境检查
  ✅ 后端服务在线

📋 [2/6] 注册流程
  ✅ 正常注册 — 获取token
  ✅ 注册返回用户信息
  ✅ 重复注册 — 拒绝
  ✅ 空密码注册 — Pydantic拒绝
  ✅ 短密码注册 (<6位) — Pydantic拒绝

📋 [3/6] 登录流程
  ✅ 正确密码 — 登录成功
  ✅ Token格式正确 (JWT)
  ✅ 错误密码 — 拒绝
  ✅ 错误密码 — 统一错误信息
  ✅ 不存在用户 — 拒绝（不泄漏邮箱是否存在）
  ✅ 不存在用户 — 统一错误信息
  ✅ 空密码登录 — Pydantic拒绝

📋 [4/6] 会话与授权
  ✅ /me 获取用户信息
  ✅ /me 无Token — 拒绝
  ✅ /me 无效Token — 拒绝
  ✅ /me 伪造Token — 拒绝（签名验证）
  ✅ 登出 — 成功
  ✅ Refresh Token — 501 未实现

📋 [5/6] 第三方登录端点
  ✅ Google 登录 — 返回授权URL
  ✅ GitHub 登录 — 跳转至 GitHub 授权页
  ✅ Google Callback — 空code返回错误

📋 [6/6] 综合场景
  ✅ 注册→登出→重新登录→/me 完整链路

=================================================================
  🎉 全部 25/25 测试通过!
=================================================================
```

### 5.2 Cloudflare Tunnel 验证

```bash
# 验证 Tunnel 连接状态
docker logs puppyforge-tunnel 2>&1 | grep "Registered"

# 通过 Tunnel 测试 Google 登录
curl https://oauth.huangjp520.de5.net/api/v1/auth/google/login

# 通过 Tunnel 测试 GitHub 登录
curl -v https://oauth.huangjp520.de5.net/api/v1/auth/github/login 2>&1 | grep "Location"
```

---

## 6. 代码变更记录

### PR 变更

| 文件 | 变更 |
| :--- | :--- |
| `backend/auth.py` | 修复 JWT sub 类型/导入缺失/`create_refresh_token`/`is_new_user` |
| `backend/test_auth_full.py` | 新增 25 项完整认证测试 |
| `docker-compose.yml` | 新增 `cloudflare-tunnel` 服务（`--profile tunnel`） |
| `.env.example` | 新增 OAuth 和 Tunnel 配置示例 |
| `README.md` | 新增部署指南和故障排查 |

### 修复明细

1. **JWT `sub` 类型不匹配** — PostgreSQL `BigInteger` 列与 JWT 字符串类型冲突
   - 修复：`create_access_token` 中 `data={"sub": str(user.id)}`
   - 修复：`get_current_user` 中 `int(user_id)` 类型转换
2. **`github_login` 缺少参数** — 缺失 `Request` 依赖注入
3. **缺失的 `create_refresh_token`** — `github_callback` 调用但未定义
4. **缺失的 `is_new_user` 变量** — `github_callback` 中用于日志区分
5. **缺失导入** — `json`, `logging`, `urllib`, `Request`, `RedirectResponse`

---

## 7. 安全注意事项

1. **错误信息统一**：登录失败返回 `"邮箱或密码错误"`，不泄漏邮箱是否存在
2. **Token 签名**：JWT 使用 HS256 签名，伪造 Token 会被拒绝
3. **密码存储**：使用 bcrypt 哈希，自动处理 72 字节截断
4. **OAuth State 参数**：防 CSRF 攻击（当前使用固定值，生产环境建议随机生成）
5. **Token 黑名单**：登出功能已预留接口（`TODO`），生产环境需要配合 Redis 实现
6. **权限控制**：`require_role` 装饰器支持基于角色的访问控制

---

## 8. 故障排查

| 错误码 | 含义 | 可能原因 |
| :--- | :--- | :--- |
| `530` | Cloudflare 无法连接源站 | Tunnel 未运行或 Public Hostname 未配置 |
| `1016` | Origin DNS error | Tunnel 未正确路由到 `localhost:8000` |
| `redirect_uri_mismatch` | OAuth 回调 URL 不一致 | .env 与 OAuth App 配置不一致 |
| `401 无效凭证` | JWT 验证失败 | Token 过期、伪造、或 `SECRET_KEY` 不匹配 |
| `500` | 内部错误 | 检查 `docker compose logs backend` |

---

*最后更新: 2026-06-06*
