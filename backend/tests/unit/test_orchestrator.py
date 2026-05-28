# backend/tests/unit/test_orchestrator.py
import pytest
from orchestrator import SoulOrchestrator
from models import PuppySoul


@pytest.mark.asyncio
async def test_orchestrator_interact():
    orchestrator = SoulOrchestrator()
    soul = PuppySoul(id="soul001", name="小黑")
    
    result = await orchestrator.interact(
        soul=soul,
        user_input="今天想吃什么？",
        user_id="testuser"
    )
    
    assert result is not None
    assert result.soul is not None
    assert len(result.response) > 0
