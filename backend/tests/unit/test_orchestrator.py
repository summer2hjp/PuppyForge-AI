# backend/tests/unit/test_orchestrator.py
import pytest
from unittest.mock import patch, AsyncMock
from orchestrator import SoulOrchestrator
from models import PuppySoul


@pytest.fixture
def sample_soul():
    return PuppySoul(
        id="soul_test_001",
        name="小黑",
        level=2,
        experience=150
    )


@pytest.mark.asyncio
async def test_orchestrator_basic_interact(sample_soul):
    """基础交互测试（Mock Grok 调用）"""
    with patch('orchestrator.SoulOrchestrator._call_grok') as mock_grok:
        mock_grok.return_value = {
            "response": "我今天很开心！",
            "trait_updates": {"affection": 8}
        }
        
        orchestrator = SoulOrchestrator()
        result = await orchestrator.interact(
            soul=sample_soul,
            user_input="今天怎么样？",
            user_id="testuser"
        )
        
        assert result is not None
        assert "response" in result


@pytest.mark.asyncio
async def test_orchestrator_error_handling(sample_soul):
    """错误处理测试"""
    with patch('orchestrator.SoulOrchestrator._call_grok') as mock_grok:
        mock_grok.side_effect = Exception("API 调用失败")
        
        orchestrator = SoulOrchestrator()
        
        with pytest.raises(Exception):
            await orchestrator.interact(
                soul=sample_soul,
                user_input="测试错误",
                user_id="testuser"
            )
