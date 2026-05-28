# backend/tests/unit/test_agents.py
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from agents.base_agent import BaseAgent
from agents.diagnosis_agent import DiagnosisAgent
from agents.prediction_agent import PredictionAgent
from agents.growth_agent import GrowthAgent
from agents.trait_drift_agent import TraitDriftAgent
from agents.memory_weaver import MemoryWeaver
from models import PuppySoul, InteractionResult, PetTraits


@pytest.fixture
def mock_grok_client():
    with patch('agents.base_agent.GrokClient') as mock:
        mock.return_value.generate_response = AsyncMock(
            return_value="基于你的描述，这只小狗当前灵魂状态：活泼好动，忠诚度高。"
        )
        yield mock


@pytest.fixture
def sample_soul():
    return PuppySoul(
        id="soul_test_001",
        name="小奶豆",
        level=3,
        traits=PetTraits(loyalty=75.0, chaos=60.0, curiosity=90.0)
    )


@pytest.mark.asyncio
async def test_base_agent_initialization():
    agent = BaseAgent(name="test_agent")
    assert agent.name == "test_agent"
    assert agent.memory is not None


@pytest.mark.asyncio
async def test_diagnosis_agent(mock_grok_client, sample_soul):
    agent = DiagnosisAgent()
    
    result = await agent.diagnose(
        soul=sample_soul,
        user_input="小狗最近总是乱咬东西",
        image_data=None  # 可选
    )
    
    assert result is not None
    assert "response" in result
    assert "trait_changes" in result
    assert isinstance(result["trait_changes"], dict)


@pytest.mark.asyncio
async def test_prediction_agent(mock_grok_client, sample_soul):
    agent = PredictionAgent()
    
    prediction = await agent.predict_growth(
        soul=sample_soul,
        days_ahead=7
    )
    
    assert prediction is not None
    assert "future_level" in prediction
    assert "predicted_traits" in prediction
    assert prediction["future_level"] >= sample_soul.level


@pytest.mark.asyncio
async def test_growth_agent(mock_grok_client, sample_soul):
    agent = GrowthAgent()
    
    result = await agent.process_growth_event(
        soul=sample_soul,
        event_type="play_session",
        intensity=0.8
    )
    
    assert result.experience_gained > 0
    assert result.new_level >= sample_soul.level


@pytest.mark.asyncio
async def test_trait_drift_agent(sample_soul):
    agent = TraitDriftAgent()
    
    drifted_soul = await agent.apply_drift(sample_soul, days=3)
    
    assert drifted_soul.traits is not None
    # 验证漂移后特征有变化（非确定性，检查范围）
    assert 0 <= drifted_soul.traits.loyalty <= 100


@pytest.mark.asyncio
async def test_memory_weaver(sample_soul):
    weaver = MemoryWeaver()
    
    memory = await weaver.weave_memory(
        soul=sample_soul,
        interaction="今天去公园玩得很开心",
        emotion_score=0.9
    )
    
    assert memory is not None
    assert memory["soul_id"] == sample_soul.id
    assert "embedding" in memory  # pgvector 支持
