# backend/tests/unit/test_orchestrator.py
import pytest
from unittest.mock import patch, AsyncMock
from orchestrator import SoulOrchestrator
from models import PuppySoul


@pytest.fixture
def mock_agents():
    with patch('orchestrator.DiagnosisAgent') as mock_diag, \
         patch('orchestrator.PredictionAgent') as mock_pred, \
         patch('orchestrator.GrowthAgent') as mock_growth:
        
        mock_diag.return_value.diagnose = AsyncMock(return_value={
            "response": "诊断结果：活泼型灵魂",
            "trait_changes": {"chaos": 10}
        })
        
        mock_pred.return_value.predict_growth = AsyncMock(return_value={
            "future_level": 4,
            "predicted_traits": {"loyalty": 82}
        })
        
        mock_growth.return_value.process_growth_event = AsyncMock(return_value={
            "experience_gained": 45,
            "new_level": 3
        })
        
        yield {
            "diagnosis": mock_diag,
            "prediction": mock_pred,
            "growth": mock_growth
        }


@pytest.fixture
def sample_soul():
    return PuppySoul(
        id="soul_test_001",
        name="小黑",
        level=2,
        experience=120
    )


@pytest.mark.asyncio
async def test_orchestrator_initialization():
    """测试编排器初始化"""
    orchestrator = SoulOrchestrator()
    assert orchestrator is not None
    assert hasattr(orchestrator, 'interact')


@pytest.mark.asyncio
async def test_orchestrator_interact_basic(mock_agents, sample_soul):
    """测试核心交互方法"""
    orchestrator = SoulOrchestrator()
    
    result = await orchestrator.interact(
        soul=sample_soul,
        user_input="今天带你去公园玩吗？",
        user_id="testuser"
    )
    
    assert result is not None
    assert "response" in result
    assert "updated_soul" in result
    assert result["updated_soul"].level >= sample_soul.level


@pytest.mark.asyncio
async def test_orchestrator_with_vision(mock_agents, sample_soul):
    """测试带视觉输入的交互"""
    orchestrator = SoulOrchestrator()
    
    result = await orchestrator.interact(
        soul=sample_soul,
        user_input="看看这张照片",
        image_base64="data:image/jpeg;base64,testdata",
        user_id="testuser"
    )
    
    assert result is not None
    assert "vision_analysis" in result or "diagnosis" in result


@pytest.mark.asyncio
async def test_orchestrator_error_handling(sample_soul):
    """测试错误处理"""
    orchestrator = SoulOrchestrator()
    
    with patch('orchestrator.SoulOrchestrator._run_diagnosis') as mock_diagnose:
        mock_diagnose.side_effect = Exception("Grok API 错误")
        
        with pytest.raises(Exception):
            await orchestrator.interact(
                soul=sample_soul,
                user_input="测试错误",
                user_id="testuser"
            )
