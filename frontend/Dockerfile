# ==================== Frontend Dockerfile (Next.js) ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --frozen-lockfile

COPY frontend/ ./
RUN npm run build

# ==================== 生产阶段 ====================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
