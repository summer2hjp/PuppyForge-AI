# --- 阶段 1: 锻造 (编译依赖) ---
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .

# ✅ 使用 uv 加速安装（可选）
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ✅ 预编译字节码
RUN python3 -m compileall /app/backend

# --- 阶段 2: 运行 (绝对隔离) ---
FROM gcr.io/distroless/python3-debian12
WORKDIR /app
COPY --from=builder /install /usr/local
COPY ./backend /app/backend

# ✅ 显式设置 PYTHONPATH
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages"
ENV PYTHONUNBUFFERED=1

# ✅ 非 root 用户运行
USER nonroot

# ✅ 修正 CMD：显式调用 python3
CMD ["/usr/bin/python3", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
