# ==========================================
# 阶段 1: 基础依赖构建 (通用)
# ==========================================
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
# 安装依赖到独立目录，避免污染系统环境
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ==========================================
# 阶段 2: 开发环境 (Dev Target)
# 特点: 使用 slim 镜像(有bash可调试), 不拷贝代码(靠挂载), 默认 root 运行(避免跨平台挂载权限问题)
# ==========================================
FROM python:3.11-slim AS dev
WORKDIR /app
# 仅拷贝依赖
COPY --from=builder /install /usr/local
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages"
ENV PYTHONUNBUFFERED=1
# 开发环境不指定 USER，使用默认 root，完美兼容 Win/Mac/Linux 的源码挂载
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ==========================================
# 阶段 3: 生产环境 (Prod Target)
# 特点: 使用 Distroless(极度安全), 代码打包进镜像, 强制 nonroot 运行
# ==========================================
FROM gcr.io/distroless/python3-debian12 AS prod
WORKDIR /app
COPY --from=builder /install /usr/local
# 生产环境必须把代码 COPY 进镜像
COPY . /app/backend 
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages"
ENV PYTHONUNBUFFERED=1
ENV HOME=/app
# Distroless 内置的非 root 用户 (UID 65532)
USER nonroot 
CMD ["/usr/bin/python3", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
