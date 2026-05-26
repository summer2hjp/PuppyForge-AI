from backend.models import PuppySoul, PetMemory, TraitDrift

def test_puppy_soul_creation():
    soul = PuppySoul(
        pet_id="puppy-123",
        traits={"energy": 0.85, "loyalty": 0.9},
        memory_count=0
    )
    assert soul.pet_id == "puppy-123"
    assert soul.traits["energy"] == 0.85

def test_trait_drift_calculation():
    base = {"energy": 0.75, "calmness": 0.8}
    events = [{"type": "exercise", "impact": 0.15}]
    result = TraitDrift.calculate(base, events)
    assert result["energy"] > 0.75
    assert 0 <= result["energy"] <= 1.0

def test_pet_memory_embedding():
    memory = PetMemory(
        pet_id="puppy-123",
        event="吃完饭后很开心",
        embedding=[0.1] * 1536  # 模拟向量
    )
    assert memory.event == "吃完饭后很开心"
