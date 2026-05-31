# ==========================================
# 🐕‍🦺 PuppyForge AI - Backend (FastAPI) Dockerfile
# 📌 基础镜像: python:3.11-slim-bookworm (安全+体积小)
# ==========================================

FROM python:3.11-slim-bookworm AS base

# ==================== 环境变量 ====================
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    APP_HOME=/app \
    PATH="/app/.local/bin:$PATH"

WORKDIR $APP_HOME

# ==================== 系统依赖 ====================
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove

# ==================== Python 依赖 ====================
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# ==================== 应用代码 ====================
COPY . .

# ==================== 安全加固 ====================
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser $APP_HOME
USER appuser

# ==================== 端口与健康检查 ====================
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# ==================== 启动命令 ====================
# 生产环境建议: gunicorn + uvicorn workers (示例已注释)
# CMD ["gunicorn", "src.main:app", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "-w", "4", "--timeout", "120"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
