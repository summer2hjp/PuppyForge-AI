import pytest
import time
import asyncio
from backend.orchestrator import SwarmOrchestrator

@pytest.mark.asyncio
class TestPerformance系统测试:

    async def test_single_diagnosis_performance(self, orchestrator):
        """单次诊断性能测试"""
        start = time.perf_counter()
        
        result = await orchestrator.run_full_diagnosis({
            "pet_id": "perf-test",
            "image_bytes": b"test_image",
            "event": "性能测试事件"
        })
        
        duration = time.perf_counter() - start
        assert duration < 3.0  # 必须在3秒内完成
        assert result["health_score"] is not None

    async def test_concurrent_diagnosis(self, orchestrator):
        """并发诊断压力测试（10个同时请求）"""
        tasks = [
            orchestrator.run_full_diagnosis({
                "pet_id": f"concurrent-{i}",
                "image_bytes": b"test",
                "event": "并发事件"
            }) for i in range(10)
        ]
        
        start = time.perf_counter()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.perf_counter() - start
        
        success_count = sum(1 for r in results if not isinstance(r, Exception))
        assert success_count >= 8  # 至少80%成功
        assert duration < 15.0     # 总耗时控制
