# 🐕‍🦺 PuppyForge-AI

### 前置准备

确保已安装 [Docker](https://docs.docker.com/engine/install/) 和 [Docker Compose](https://docs.docker.com/compose/install/)。

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入以下必要配置：

| 变量 | 说明 | 必需 |
| :--- | :--- | :---: |
| `SECRET_KEY` | JWT 签名密钥，生产环境请用 `openssl rand -hex 32` 生成 | ✅ |
| `POSTGRES_PASSWORD` | 数据库密码 | ✅ |
| `REDIS_PASSWORD` | Redis 密码 | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | 第三方登录 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | 第三方登录 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | 第三方登录 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | 第三方登录 |
| `CF_TUNNEL_TOKEN` | Cloudflare Tunnel Token | Tunnel |

### 2. 启动服务

```bash
# 开发模式（仅后端 + 数据库）
docker compose up -d --build

# 生产模式（含 Cloudflare Tunnel）
docker compose --profile tunnel up -d --build

# 仅启动 Tunnel
docker compose --profile tunnel up -d cloudflare-tunnel
```

### 3. 验证服务

```bash
# 健康检查
curl http://localhost:8000/health

# 注册测试
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'

# 登录测试
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
```

### 4. 访问服务

| 服务 | 地址 |
| :--- | :--- |
| Backend API | `http://localhost:8000` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| Frontend | `http://localhost:3000` |

---

## 🌐 Cloudflare Tunnel

系统支持通过 Cloudflare Tunnel 暴露服务，用于第三方 OAuth 回调等需要固定公网域名的场景。

### 架构

```
用户 → https://oauth.你的域名.com → Cloudflare Edge → cloudflared → localhost:8000
```

### 配置步骤

1. **安装 cloudflared**（仅首次配置需要）
   ```bash
   docker compose --profile tunnel run cloudflare-tunnel tunnel login
   ```
   按照提示在浏览器中完成 Cloudflare 身份验证。

2. **创建 Tunnel**（或使用已有的）
   ```bash
   docker compose --profile tunnel run cloudflare-tunnel tunnel create puppyforge
   ```
   获取 Tunnel Token，填入 `.env` 的 `CF_TUNNEL_TOKEN`。

3. **Cloudflare Dashboard 配置路由**
   - 进入 Zero Trust → Networks → Tunnels → 你的 Tunnel
   - 添加 Public Hostname：
     - **Subdomain**: `oauth`
     - **Domain**: `你的域名`
     - **Type**: `HTTP`
     - **URL**: `localhost:8000`

4. **启动 Tunnel**
   ```bash
   docker compose --profile tunnel up -d cloudflare-tunnel
   ```

5. **配置 OAuth 回调 URL**
   - GitHub OAuth App: `Authorization callback URL` → `https://oauth.你的域名/api/v1/auth/github/callback`
   - Google OAuth: `Authorized redirect URIs` → `https://oauth.你的域名/api/v1/auth/google/callback`

### ⚠️ Docker DNS 问题

本环境使用 `systemd-resolved` 时 `cloudflared` 的 SRV DNS 查询会失败，因此 `docker-compose.yml` 中通过 `--edge` 参数直接指定 Cloudflare 边缘 IP，跳过 DNS 查找。如果你的环境 DNS 正常，可以去掉 `--edge` 参数使用自动发现。

---

## 🧪 测试

```bash
# 运行完整认证测试（需后端运行中）
docker cp backend/test_auth_full.py puppyforge-backend:/app/test_auth_full.py
docker exec puppyforge-backend python3 /app/test_auth_full.py

# 后端单元测试
cd backend && python -m pytest tests/ -v --tb=short

# 前端测试
cd frontend && npm test
```

---

## 🔧 故障排查

| 问题 | 可能原因 | 解决 |
| :--- | :--- | :--- |
| Tunnel 连接失败 | DNS 无法解析 SRV 记录 | 使用 `--edge` 参数指定边缘 IP |
| OAuth 回调 1016 错误 | Tunnel Public Hostname 未配置 | Dashboard 添加路由规则 |
| 第三方登录 redirect_uri 不匹配 | .env 与 OAuth App 配置不一致 | 检查两端 redirect_uri 是否完全一致 |
| 数据库连接失败 | PostgreSQL 未就绪 | `docker compose logs postgres` 查看 |
| JWT 认证失败 | SECRET_KEY 不一致 | 检查 .env 配置 |
