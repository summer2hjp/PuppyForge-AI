# PuppyForge AI 分布式部署指南

## 📋 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        局域网 (192.168.3.x)                      │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │  192.168.3.106   │         │       192.168.3.160          │ │
│  │  (前端机器)       │         │       (后端机器)              │ │
│  │                  │         │                              │ │
│  │  ┌────────────┐  │         │  ┌────────────┐              │ │
│  │  │  Frontend  │  │  HTTP   │  │  Backend   │              │ │
│  │  │  Next.js   │◄─┼─────────┼─►│  FastAPI   │              │ │
│  │  │  :3000     │  │  WS     │  │  :8000     │              │ │
│  │  └────────────┘  │         │  └─────┬──────┘              │ │
│  │                  │         │        │                     │ │
│  │                  │         │  ┌─────▼──────┐              │ │
│  │                  │         │  │ PostgreSQL │              │ │
│  │                  │         │  │   :5432    │              │ │
│  │                  │         │  └────────────┘              │ │
│  │                  │         │  ┌────────────┐              │ │
│  │                  │         │  │   Redis    │              │ │
│  │                  │         │  │   :6379    │              │ │
│  │                  │         │  └────────────┘              │ │
│  └──────────────────┘         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 部署目标

1. **192.168.3.106**: 部署前端服务 (Next.js)
2. **192.168.3.160**: 部署后端服务 (FastAPI) + 数据库 (PostgreSQL + Redis)
3. 实现跨机器通信 (前端 ↔ 后端)

---

## 📦 前置要求

### 两台机器都需要安装

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 重新登录或执行以下命令使 Docker 组生效
newgrp docker
```

### 网络互通性检查

在任意一台机器上执行：

```bash
# 从 192.168.3.106 测试能否访问 192.168.3.160
ping 192.168.3.160

# 从 192.168.3.160 测试能否访问 192.168.3.106
ping 192.168.3.106
```

如果 ping 不通，请检查防火墙设置：

```bash
# 查看防火墙状态
sudo ufw status

# 如果需要，允许局域网通信
sudo ufw allow from 192.168.3.0/24 to any port 22,3000,8000,5432,6379
```

---

## 🚀 部署步骤

### 第一步：在 192.168.3.160 (后端机器) 部署后端和数据库

#### 1.1 克隆项目

```bash
ssh puppy@192.168.3.160
cd ~
git clone https://github.com/summer2hjp/PuppyForge-AI.git
cd PuppyForge-AI
```

#### 1.2 创建后端配置文件

```bash
# 复制环境变量模板
cp .env.example .env.backend
```

编辑 `.env.backend` 文件：

```bash
nano .env.backend
```

配置以下内容（**重要：修改 IP 地址为实际的后端机器 IP**）：

```ini
# ==================== 🐳 Docker & 基础设施 ====================
COMPOSE_PROJECT_NAME=puppyforge-backend
DOCKER_REGISTRY=docker.io
DOCKER_NAMESPACE=summer2hjp

# 服务端口映射 (数据库只暴露给内网)
BACKEND_PORT=8000
PG_PORT=5432
REDIS_PORT=6379

# ==================== 🗄️ 数据库 (PostgreSQL) ====================
POSTGRES_USER=puppy_admin
POSTGRES_PASSWORD=change_me_secure_pg_password_!@#
POSTGRES_DB=puppyforge_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# ==================== ⚡ 缓存 & 队列 (Redis) ====================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=change_me_secure_redis_password_!@#
REDIS_DB=0

# ==================== 🔙 后端服务 (FastAPI/Python) ====================
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-super-secret-key-change-in-prod-7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o
API_V1_PREFIX=/api/v1
# 允许前端机器的 URL
ALLOWED_ORIGINS=http://192.168.3.106:3000,http://localhost:3000

# JWT 认证
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ==================== 🤖 AI / LLM 配置 ====================
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048

# API Keys (根据实际情况配置)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==================== 📊 观测性 & 日志 ====================
LOG_LEVEL=info
LOG_FORMAT=json

# ==================== 🚀 功能开关 ====================
ENABLE_REBEL_MODE=true
ENABLE_MEMORY_PERSISTENCE=true
```

#### 1.3 创建后端专用 docker-compose 文件

```bash
nano docker-compose.backend.yml
```

内容如下：

```yaml
# ==========================================
# 🐕‍🦺 PuppyForge AI - 后端专用 Docker Compose
# ==========================================

services:
  # ==================== 🗄️ PostgreSQL ====================
  postgres:
    image: postgres:16-alpine
    container_name: pf-postgres
    env_file: .env.backend
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-puppy_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-change_me_secure_pg_password_!@#}
      POSTGRES_DB: ${POSTGRES_DB:-puppyforge_db}
    volumes:
      - postgres_/var/lib/postgresql/data
    ports:
      - "${PG_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-puppy_admin} -d ${POSTGRES_DB:-puppyforge_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
    networks:
      - puppyforge-net
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '2.0'

  # ==================== ⚡ Redis ====================
  redis:
    image: redis:7-alpine
    container_name: pf-redis
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-change_me_secure_redis_password_!@#}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
    env_file: .env.backend
    volumes:
      - redis_/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-change_me_secure_redis_password_!@#}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - puppyforge-net
    deploy:
      resources:
        limits:
          memory: 512M

  # ==================== 🔙 Backend (FastAPI) ====================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        - BUILDKIT_INLINE_CACHE=1
    container_name: pf-backend
    env_file: .env.backend
    environment:
      # 🔗 数据库连接 (容器内部使用服务名)
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER:-puppy_admin}:${POSTGRES_PASSWORD:-change_me_secure_pg_password_!@#}@postgres:5432/${POSTGRES_DB:-puppyforge_db}
      REDIS_URL: redis://:${REDIS_PASSWORD:-change_me_secure_redis_password_!@#}@redis:6379/${REDIS_DB:-0}
      # 🌐 允许跨域访问 (前端机器 IP)
      ALLOWED_ORIGINS: http://192.168.3.106:3000,http://localhost:3000
      # 📊 观测性
      LOG_LEVEL: ${LOG_LEVEL:-info}
      # 🔑 安全配置
      SECRET_KEY: ${SECRET_KEY:-your-super-secret-key-change-in-prod}
      ENVIRONMENT: ${ENVIRONMENT:-production}
      DEBUG: ${DEBUG:-False}
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - puppyforge-net
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --log-level ${LOG_LEVEL:-info}
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2.0'

# ==================== 📦 持久化卷 ====================
volumes:
  postgres_:
    driver: local
  redis_:
    driver: local

# ==================== 🌐 网络 ====================
networks:
  puppyforge-net:
    driver: bridge
    name: puppyforge-backend-network
```

#### 1.4 启动后端服务

```bash
# 构建并启动服务
docker-compose -f docker-compose.backend.yml up -d --build

# 查看服务状态
docker-compose -f docker-compose.backend.yml ps

# 查看日志
docker-compose -f docker-compose.backend.yml logs -f
```

#### 1.5 验证后端服务

```bash
# 测试本地访问
curl http://localhost:8000/api/v1/health

# 测试从外部访问 (应该能访问)
curl http://192.168.3.160:8000/api/v1/health

# 查看运行中的容器
docker ps
```

---

### 第二步：在 192.168.3.106 (前端机器) 部署前端

#### 2.1 克隆项目

```bash
ssh puppy@192.168.3.106
cd ~
git clone https://github.com/summer2hjp/PuppyForge-AI.git
cd PuppyForge-AI
```

#### 2.2 创建前端配置文件

```bash
# 复制环境变量模板
cp .env.example .env.frontend
```

编辑 `.env.frontend` 文件：

```bash
nano .env.frontend
```

配置以下内容（**重要：修改 BACKEND_IP 为实际的后端机器 IP**）：

```ini
# ==================== 🐳 Docker & 基础设施 ====================
COMPOSE_PROJECT_NAME=puppyforge-frontend
DOCKER_REGISTRY=docker.io
DOCKER_NAMESPACE=summer2hjp

# 服务端口映射
FRONTEND_PORT=3000

# ==================== 🎨 前端服务 (Next.js) ====================
# ⚠️ NEXT_PUBLIC_ 开头的变量会暴露到浏览器客户端
NEXT_PUBLIC_APP_NAME=PuppyForge AI
# 🔗 关键配置：指向后端机器的 IP 地址
NEXT_PUBLIC_API_URL=http://192.168.3.160:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://192.168.3.160:8000/ws
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# 前端 SSR/Server Actions 专用（不暴露给浏览器）
BACKEND_SERVICE_SECRET=your-super-secret-key-change-in-prod-7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o

# ==================== 📊 其他配置 ====================
NODE_ENV=production
```

#### 2.3 创建前端专用 docker-compose 文件

```bash
nano docker-compose.frontend.yml
```

内容如下：

```yaml
# ==========================================
# 🐕‍🦺 PuppyForge AI - 前端专用 Docker Compose
# ==========================================

services:
  # ==================== 🎨 Frontend (Next.js) ====================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        # ⚠️ Next.js 的 NEXT_PUBLIC_* 变量必须在 BUILD 时注入
        - NEXT_PUBLIC_API_URL=http://192.168.3.160:8000/api/v1
        - NEXT_PUBLIC_WS_URL=ws://192.168.3.160:8000/ws
        - NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-PuppyForge AI}
    container_name: pf-frontend
    env_file: .env.frontend
    environment:
      # 🔒 服务端变量（不暴露给浏览器）
      - NODE_ENV=${NODE_ENV:-production}
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    restart: unless-stopped
    networks:
      - puppyforge-frontend-net
    deploy:
      resources:
        limits:
          memory: 1024M
          cpus: '2.0'

# ==================== 🌐 网络 ====================
networks:
  puppyforge-frontend-net:
    driver: bridge
    name: puppyforge-frontend-network
```

#### 2.4 启动前端服务

```bash
# 构建并启动服务
docker-compose -f docker-compose.frontend.yml up -d --build

# 查看服务状态
docker-compose -f docker-compose.frontend.yml ps

# 查看日志
docker-compose -f docker-compose.frontend.yml logs -f
```

#### 2.5 验证前端服务

```bash
# 测试本地访问
curl http://localhost:3000

# 测试从外部访问
curl http://192.168.3.106:3000

# 查看运行中的容器
docker ps
```

---

## 🔧 跨机器通信验证

### 3.1 测试前端到后端的 HTTP 通信

在前端机器 (192.168.3.106) 上执行：

```bash
# 测试能否访问后端 API
curl http://192.168.3.160:8000/api/v1/health

# 如果返回 JSON 响应，说明通信正常
```

### 3.2 测试 WebSocket 通信

在浏览器中访问 `http://192.168.3.106:3000`，打开开发者工具 (F12)，查看 Console 和 Network 标签页：

1. 应该能看到 WebSocket 连接到 `ws://192.168.3.160:8000/ws`
2. 连接状态应该是 "Connected"

### 3.3 端到端测试

1. 打开浏览器访问：`http://192.168.3.106:3000`
2. 尝试与 AI 进行对话
3. 观察请求是否成功发送到后端并返回响应

---

## 🔒 安全建议

### 防火墙配置

#### 在后端机器 (192.168.3.160) 上：

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 只允许前端机器访问后端端口
sudo ufw allow from 192.168.3.106 to any port 8000

# 数据库端口只允许本地访问 (Docker 容器间通信)
# 如果需要从外部访问数据库，限制特定 IP
# sudo ufw allow from 192.168.3.106 to any port 5432

# 查看防火墙状态
sudo ufw status verbose
```

#### 在前端机器 (192.168.3.106) 上：

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许前端端口
sudo ufw allow 3000/tcp

# 查看防火墙状态
sudo ufw status verbose
```

### 生产环境建议

1. **使用 HTTPS**: 在生产环境中，建议使用 Nginx 或 Traefik 作为反向代理，配置 SSL/TLS 证书
2. **强密码**: 修改所有默认密码（数据库、Redis、JWT 密钥等）
3. **定期更新**: 保持系统和 Docker 镜像更新
4. **监控日志**: 定期检查服务日志，发现异常

---

## 🛠️ 常见问题排查

### Q1: 前端无法连接后端

**症状**: 浏览器显示网络错误或 CORS 错误

**解决方案**:
1. 检查后端机器的防火墙是否允许 8000 端口
2. 确认后端服务的 `ALLOWED_ORIGINS` 包含前端机器的 URL
3. 测试网络连通性：`curl http://192.168.3.160:8000/api/v1/health`

### Q2: WebSocket 连接失败

**症状**: 前端显示 WebSocket 断开或无法连接

**解决方案**:
1. 确认后端 WebSocket 服务正常运行
2. 检查防火墙是否允许 WebSocket 流量
3. 确认 `NEXT_PUBLIC_WS_URL` 配置正确

### Q3: 数据库连接失败

**症状**: 后端日志显示无法连接数据库

**解决方案**:
1. 检查 PostgreSQL 容器是否正常运行：`docker ps | grep postgres`
2. 查看数据库日志：`docker logs pf-postgres`
3. 确认 `DATABASE_URL` 配置正确

### Q4: 跨域 (CORS) 错误

**症状**: 浏览器控制台显示 CORS 相关错误

**解决方案**:
1. 在后端 `.env.backend` 中配置正确的 `ALLOWED_ORIGINS`
2. 确保格式正确：`http://192.168.3.106:3000`
3. 重启后端服务：`docker-compose -f docker-compose.backend.yml restart backend`

---

## 📝 维护命令

### 查看服务状态

```bash
# 后端机器
docker-compose -f docker-compose.backend.yml ps

# 前端机器
docker-compose -f docker-compose.frontend.yml ps
```

### 查看日志

```bash
# 后端日志
docker-compose -f docker-compose.backend.yml logs -f backend

# 前端日志
docker-compose -f docker-compose.frontend.yml logs -f frontend

# 数据库日志
docker-compose -f docker-compose.backend.yml logs -f postgres
```

### 重启服务

```bash
# 重启单个服务
docker-compose -f docker-compose.backend.yml restart backend
docker-compose -f docker-compose.frontend.yml restart frontend

# 重启所有服务
docker-compose -f docker-compose.backend.yml restart
docker-compose -f docker-compose.frontend.yml restart
```

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose -f docker-compose.backend.yml up -d --build
docker-compose -f docker-compose.frontend.yml up -d --build
```

### 停止服务

```bash
# 停止所有服务
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.frontend.yml down

# 停止并删除数据卷 (谨慎使用!)
# docker-compose -f docker-compose.backend.yml down -v
```

---

## 📊 架构图说明

```
用户浏览器
    │
    ▼
┌─────────────────────────┐
│  192.168.3.106:3000     │
│  Frontend (Next.js)     │
│                         │
│  • 静态资源服务          │
│  • 客户端渲染            │
│  • API 请求转发          │
└───────────┬─────────────┘
            │ HTTP/WS
            │ (跨机器通信)
            ▼
┌─────────────────────────┐
│  192.168.3.160:8000     │
│  Backend (FastAPI)      │
│                         │
│  • REST API             │
│  • WebSocket            │
│  • 业务逻辑处理          │
│  • AI 模型调用           │
└───────────┬─────────────┘
            │
            ▼
    ┌───────────────┐
    │  PostgreSQL   │
    │  :5432        │
    │  数据持久化    │
    └───────────────┘
    
    ┌───────────────┐
    │  Redis        │
    │  :6379        │
    │  缓存/会话    │
    └───────────────┘
```

---

## ✅ 部署检查清单

- [ ] 两台机器都安装了 Docker 和 Docker Compose
- [ ] 两台机器之间可以互相 ping 通
- [ ] 防火墙已正确配置，允许必要的端口
- [ ] 后端机器 (192.168.3.160) 的后端服务已启动
- [ ] 后端机器 (192.168.3.160) 的数据库服务已启动
- [ ] 前端机器 (192.168.3.106) 的前端服务已启动
- [ ] 前端可以访问后端 API (`curl http://192.168.3.160:8000/api/v1/health`)
- [ ] WebSocket 连接正常
- [ ] 浏览器中可以正常使用应用

---

## 📚 参考链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [FastAPI 部署文档](https://fastapi.tiangolo.com/deployment/)

---

**最后更新**: 2025-06-02
**项目版本**: PuppyForge AI v1.0.0
