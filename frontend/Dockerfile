# ==========================================
# 🐕‍🦺 PuppyForge AI - Frontend (Next.js) Dockerfile
# 📌 基础镜像: node:20-alpine (极速+轻量)
# ⚠️ 前提: next.config.js 中必须启用 output: 'standalone'
# ==========================================

# ==================== 阶段 1: 安装依赖 ====================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci && \
    npm cache clean --force

# ==================== 阶段 2: 构建应用 ====================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 注入构建时环境变量 (仅 NEXT_PUBLIC_* 会打包到客户端)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
ARG NEXT_PUBLIC_APP_NAME=PuppyForge AI

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NODE_ENV=production

# 构建 Next.js
RUN npm run build

# ==================== 阶段 3: 生产运行 ====================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    INTERNAL_BACKEND_URL=http://backend:8000

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制独立构建产物 (standalone)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# 启动 Next.js 独立服务器
CMD ["node", "server.js"]
