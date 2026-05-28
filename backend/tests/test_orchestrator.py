from orchestrator import SwarmOrchestrator

def test_orchestrator_health_diagnosis():
    orchestrator = SwarmOrchestrator()
    result = orchestrator.run_diagnosis({
        "pet_id": "puppy-123",
        "image_analysis": {"traits": ["playful"]}
    })
    assert "soul_traits" in result
    assert "recommendations" in result
    assert isinstance(result["recommendations"], list)
