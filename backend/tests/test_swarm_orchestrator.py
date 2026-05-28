import pytest
from orchestrator import SwarmOrchestrator

@pytest.mark.asyncio
async def test_swarm_orchestrator_parallel_agents():
    """测试多Agent并行执行能力"""
    orchestrator = SwarmOrchestrator()

    tasks = [
        {"agent": "vision", "input": b"image1"},
        {"agent": "memory", "input": "玩球很开心"},
        {"agent": "diagnosis", "input": {"traits": ["playful"]}}
    ]

    results = await orchestrator.run_parallel_agents(tasks)

    assert len(results) == 3
    assert "vision" in results
    assert "memory" in results
    assert "diagnosis" in results
