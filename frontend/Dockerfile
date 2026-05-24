# ==========================================
# 阶段 1: 依赖安装 (Deps)
# ==========================================
FROM node:20-alpine AS deps
# 某些 npm 包（如 bcrypt, canvas 等）在 alpine 下需要 libc 兼容层
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 仅拷贝 package 文件以利用 Docker 缓存
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# 根据存在的 lock 文件自动选择包管理器安装依赖
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ==========================================
# 阶段 2: 代码构建 (Builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ✅ 关键：在构建时接收并注入 NEXT_PUBLIC_ 环境变量
# 这些变量会被 Webpack/Turbopack 硬编码打包到前端的 JS 文件中
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# 禁用 Next.js 遥测，加快构建速度并保护隐私
ENV NEXT_TELEMETRY_DISABLED=1

# 执行构建
RUN npm run build

# ==========================================
# 阶段 3: 生产环境运行 (Runner)
# 特点: 极致轻量、非 root 用户运行、仅包含必要产物
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户和组，提升安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 拷贝 public 目录（如果有）
COPY --from=builder /app/public ./public

# ✅ 关键：拷贝 Standalone 产物
# 注意：这要求你的 next.config.js 中开启了 output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# Next.js 14/15 必须设置 HOSTNAME，否则在 Docker 中可能会出现 DNS 解析超时
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动 standalone 服务器
CMD ["node", "server.js"]

# ==========================================
# 阶段 4: 本地开发环境 (Dev)
# 特点: 供 docker-compose.override.yml 使用，支持热重载
# ==========================================
FROM node:20-alpine AS dev
WORKDIR /app
# 仅拷贝依赖，源码通过 compose volumes 挂载
COPY --from=deps /app/node_modules ./node_modules
ENV NEXT_TELEMETRY_DISABLED=1
# 开发环境使用默认 root，避免跨平台挂载权限报错
CMD ["npm", "run", "dev"]
