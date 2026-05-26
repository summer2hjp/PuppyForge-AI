import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from backend.orchestrator import SwarmOrchestrator
from backend.agents import VisionAgent, DiagnosisAgent, MemoryAgent

@pytest.fixture
def orchestrator():
    return SwarmOrchestrator()

@pytest.mark.asyncio
class TestAI-Agent错误处理优化:

    async def test_vision_agent_network_timeout(self, orchestrator):
        """VisionAgent 网络超时 - 重试机制 + 降级"""
        vision_agent = VisionAgent()
        vision_agent.analyze = AsyncMock(side_effect=asyncio.TimeoutError("Vision API timeout"))

        with pytest.raises(asyncio.TimeoutError):
            result = await vision_agent.analyze(b"image_data")

        # 验证是否触发降级
        fallback_result = await vision_agent.analyze_with_fallback(b"image_data")
        assert fallback_result["health_score"] == 50
        assert "error" in fallback_result
        assert "建议重试" in fallback_result["message"]

    async def test_diagnosis_agent_invalid_traits(self, orchestrator):
        """DiagnosisAgent 接收无效trait数据"""
        diagnosis_agent = DiagnosisAgent()
        invalid_data = {"traits": None, "health_score": -10}  # 非法数据

        result = await diagnosis_agent.generate_report(invalid_data)

        assert result["risk_level"] == "unknown"
        assert result["health_score"] == 50  # 默认安全值
        assert "数据格式错误" in result["message"]

    async def test_memory_agent_embedding_failure(self, orchestrator):
        """MemoryAgent 向量嵌入服务失败"""
        memory_agent = MemoryAgent()
        memory_agent._generate_embedding = AsyncMock(side_effect=Exception("Embedding service unavailable"))

        result = await memory_agent.store_memory(
            pet_id="puppy-123",
            event="测试记忆",
            context={}
        )

        assert result["status"] == "partial_success"
        assert "embedding" not in result
        assert result["fallback_memory"] is not None

    async def test_orchestrator_full_pipeline_with_partial_failure(self, orchestrator):
        """SwarmOrchestrator 部分Agent失败 - 继续执行其他Agent"""
        input_data = {
            "pet_id": "puppy-123",
            "image_bytes": b"fake_image",
            "event": "正常事件"
        }

        # 模拟Vision失败，但其他Agent正常
        orchestrator.vision_agent.analyze = AsyncMock(side_effect=Exception("Vision failed"))
        orchestrator.diagnosis_agent.generate_report = AsyncMock(return_value={
            "health_score": 75, "soul_traits": {"energy": 0.8}
        })

        result = await orchestrator.run_full_diagnosis(input_data)

        assert result["status"] == "partial_success"
        assert result["health_score"] == 75
        assert "warnings" in result
        assert len(result["warnings"]) > 0

    async def test_orchestrator_critical_failure(self, orchestrator):
        """所有Agent均失败 - 最终安全降级"""
        orchestrator.run_parallel_agents = AsyncMock(side_effect=Exception("All agents crashed"))

        result = await orchestrator.run_full_diagnosis({"pet_id": "error-puppy"})

        assert result["health_score"] == 30
        assert result["soul_traits"] == {}
        assert "系统暂时不可用" in result["message"]
        assert "建议稍后重试" in result["message"]

    async def test_agent_retry_mechanism(self, orchestrator):
        """测试重试策略（最多3次）"""
        agent = VisionAgent()
        agent.analyze = AsyncMock(side_effect=[
            asyncio.TimeoutError(),
            asyncio.TimeoutError(),
            {"traits": ["energetic"], "confidence": 0.85}  # 第3次成功
        ])

        result = await agent.analyze_with_retry(b"image", max_retries=3)

        assert result["traits"] == ["energetic"]
        assert agent.analyze.call_count == 3
