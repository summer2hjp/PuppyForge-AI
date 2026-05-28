import pytest
from agents.orchestrator import SwarmOrchestrator
from agents import VisionAgent, DiagnosisAgent, MemoryAgent, TraitDriftAgent

@pytest.fixture
def orchestrator():
    return SwarmOrchestrator()

@pytest.mark.asyncio
class TestAIAgent:

    async def test_orchestrator_full_pipeline(self, orchestrator):
        """完整AI-Agent系统测试：Vision → Diagnosis → Memory → TraitDrift"""
        input_data = {
            "pet_id": "puppy-123",
            "image_bytes": b"fake_image_data",
            "event": "今天和小主人跑步",
            "context": {"activity": "exercise"}
        }

        result = await orchestrator.run_full_diagnosis(input_data)

        # 系统测试断言
        assert result is not None
        assert "health_score" in result
        assert "soul_traits" in result
        assert "recommendations" in result
        assert "drift_prediction" in result
        assert isinstance(result["recommendations"], list)
        assert result["health_score"] >= 0 and result["health_score"] <= 100

    async def test_vision_agent_independent(self, orchestrator):
        """VisionAgent独立单元测试"""
        vision_agent = VisionAgent()
        result = await vision_agent.analyze(b"test_image")

        assert "traits" in result
        assert "confidence" in result
        assert isinstance(result["traits"], list)
        assert 0 <= result["confidence"] <= 1.0

    async def test_diagnosis_agent_with_traits(self, orchestrator):
        """DiagnosisAgent + Trait漂移集成测试"""
        diagnosis_agent = DiagnosisAgent()
        analysis_data = {
            "traits": ["energetic", "loyal", "anxious"],
            "health_score": 65
        }

        result = await diagnosis_agent.generate_report(analysis_data)

        assert "soul_traits" in result
        assert result["risk_level"] in ["low", "medium", "high"]
        assert "drift_prediction" in result

    async def test_memory_agent_embedding(self, orchestrator):
        """PetMemory Agent记忆嵌入测试"""
        memory_agent = MemoryAgent()
        memory = await memory_agent.store_memory(
            pet_id="puppy-123",
            event="第一次看到雪，很兴奋",
            context={"emotion": "happy"}
        )

        assert memory["pet_id"] == "puppy-123"
        assert "embedding" in memory
        assert len(memory["embedding"]) > 0

    async def test_trait_drift_agent(self, orchestrator):
        """TraitDriftAgent漂移预测系统测试"""
        drift_agent = TraitDriftAgent()
        current_traits = {"energy": 0.75, "loyalty": 0.85, "calmness": 0.6}

        result = await drift_agent.predict_drift(
            current_traits=current_traits,
            recent_events=["exercise", "social_interaction", "stress"]
        )

        assert "predicted_traits" in result
        assert "drift_magnitude" in result
        assert result["drift_magnitude"] >= 0
        # 能量应因exercise事件提升
        assert result["predicted_traits"]["energy"] > current_traits["energy"]
