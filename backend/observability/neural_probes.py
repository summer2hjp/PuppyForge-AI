from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
import asyncio
import time
from functools import wraps
from typing import Callable, Any, Dict

# === OTel 全局初始化（大胆注入神经探针） ===
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

metric_reader = PeriodicExportingMetricReader(ConsoleMetricExporter())
meter_provider = MeterProvider(metric_readers=[metric_reader])
metrics.set_meter_provider(meter_provider)
meter = metrics.get_meter(__name__)

# 核心神经指标
llm_tokens_counter = meter.create_counter("llm_tokens_total", "LLM 调用 Token 总量")
forge_quality_hist = meter.create_histogram("forge_quality_score", "Forge 资产质量分布", unit="score")
persona_drift_latency_hist = meter.create_histogram("persona_drift_latency_ms", "人格漂移耗时", unit="ms")
interaction_throughput = meter.create_counter("interactions_total", "总互动次数")

def observe_span(span_name: str):
    """统一链路追踪装饰器"""
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(span_name) as span:
                start_time = time.perf_counter()
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.record_exception(e)
                    raise
                finally:
                    latency_ms = (time.perf_counter() - start_time) * 1000
                    if "drift" in span_name.lower():
                        persona_drift_latency_hist.record(int(latency_ms))
        return async_wrapper
    return decorator

class NeuralProbes:
    def __init__(self):
        self.tracer = tracer

    @observe_span("neuromorphic.mutate_persona_with_forge")
    async def record_persona_drift(self, puppy_id: str, drift_data: Dict, forge_quality: float = 0.0):
        """记录人格漂移 + Forge 反馈"""
        with self.tracer.start_as_current_span("trait_drift_calculation") as span:
            span.set_attribute("puppy_id", puppy_id)
            total_drift = sum(drift_data.get("delta", {}).values())
            span.set_attribute("total_drift_magnitude", total_drift)
            
            persona_drift_latency_hist.record(45)  # 模拟或真实测量
            forge_quality_hist.record(forge_quality)
            interaction_throughput.add(1)

    @observe_span("forge.pipeline_stage")
    async def record_forge_stage(self, stage: str, quality: float, tokens: int = 0):
        """Forge 各阶段追踪"""
        forge_quality_hist.record(quality)
        if tokens > 0:
            llm_tokens_counter.add(tokens)

    def setup_instrumentation(self, app):
        """一键初始化全链路追踪"""
        FastAPIInstrumentor.instrument_app(app)
        RedisInstrumentor().instrument()
        # Qdrant / OpenAI instrumentation 可后续扩展
