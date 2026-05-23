import time
from functools import wraps
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter

# 初始化 OTel 探针 (生产环境指向 Jaeger/Tempo 和 Prometheus/Mimir)
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer("puppyforge.soul")

# 配置指标收集器
metric_reader = PeriodicExportingMetricReader(ConsoleMetricExporter(), export_interval_millis=5000)
metrics.set_meter_provider(MeterProvider(metric_readers=[metric_reader]))
meter = metrics.get_meter("puppyforge.cost")

# 定义核心业务指标
llm_token_counter = meter.create_counter("puppy.llm.tokens", unit="token", description="LLM Token consumption")
llm_cost_histogram = meter.create_histogram("puppy.llm.cost_usd", unit="USD", description="Estimated LLM cost")
wasm_fuel_gauge = meter.create_histogram("puppy.wasm.fuel_consumed", unit="fuel", description="WASM execution fuel")

def trace_puppy_thinking(puppy_id: str):
    """链路追踪装饰器：捕获宠物的完整思考周期"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            with tracer.start_as_current_span(
                "puppy_thinking_cycle",
                attributes={"puppy.id": puppy_id, "puppy.state": "awake"}
            ) as span:
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    
                    # 记录情绪突变 (假设 result 包含性格漂移数据)
                    if hasattr(result, 'trait_drift'):
                        span.set_attribute("puppy.trait_drift", str(result.trait_drift))
                        
                    span.set_status(trace.StatusCode.OK)
                    return result
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR)
                    raise
                finally:
                    span.set_attribute("puppy.cycle.duration_ms", (time.time() - start_time) * 1000)
        return wrapper
    return decorator

def meter_llm_usage(model: str, puppy_id: str):
    """指标监控装饰器：精准计算 LLM 财务成本"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            response = await func(*args, **kwargs)
            
            # 假设 response 包含 usage 信息
            prompt_tokens = getattr(response.usage, 'prompt_tokens', 0)
            completion_tokens = getattr(response.usage, 'completion_tokens', 0)
            
            # 记录 Token 消耗
            llm_token_counter.add(prompt_tokens, {"type": "prompt", "model": model, "puppy.id": puppy_id})
            llm_token_counter.add(completion_tokens, {"type": "completion", "model": model, "puppy.id": puppy_id})
            
            # 动态计算成本 (Mock: GPT-4o 价格)
            cost = (prompt_tokens * 0.000005) + (completion_tokens * 0.000015)
            llm_cost_histogram.record(cost, {"model": model, "puppy.id": puppy_id})
            
            return response
        return wrapper
    return decorator

def meter_wasm_fuel(puppy_id: str):
    """指标监控装饰器：追踪 WASM 灵魂质量"""
    def decorator(func):
        @wraps(func)
        async def wrapper(wasm_sandbox, *args, **kwargs):
            # 记录执行前的燃料
            fuel_before = wasm_sandbox.store.get_fuel() if hasattr(wasm_sandbox.store, 'get_fuel') else 10000
            
            result = func(wasm_sandbox, *args, **kwargs)
            
            # 计算实际消耗的燃料
            fuel_after = wasm_sandbox.store.get_fuel() if hasattr(wasm_sandbox.store, 'get_fuel') else 0
            consumed = fuel_before - fuel_after
            
            # 记录燃料消耗，用于后续生成“劣质脚本黑名单”
            wasm_fuel_gauge.record(consumed, {"puppy.id": puppy_id, "status": "success"})
            return result
        return wrapper
    return decorator
