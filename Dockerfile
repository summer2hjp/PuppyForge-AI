# --- 阶段 1: 锻造 (编译依赖) ---
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- 阶段 2: 运行 (绝对隔离) ---
FROM gcr.io/distroless/python3-debian12
WORKDIR /app
COPY --from=builder /install /usr/local
COPY ./backend /app/backend

# 非 root 用户运行 (distroless 默认 nonroot)
USER nonroot
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages"
CMD ["/usr/bin/python3", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
