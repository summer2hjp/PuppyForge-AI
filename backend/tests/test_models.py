# backend/tests/test_models.py
import pytest
from models import PetTraits, PuppySoul, PetMemory, InteractionResult
from datetime import datetime
import uuid


def test_pet_traits_default_values():
    traits = PetTraits()
    assert traits.loyalty == 65.0
    assert traits.chaos == 85.0
    assert traits.curiosity == 92.0
    assert 0 <= traits.loyalty <= 100


def test_puppy_soul_creation():
    soul = PuppySoul(
        id=str(uuid.uuid4()),
        name="小奶豆",
        level=1,
        owner_id=None
    )
    assert soul.level == 1
    assert soul.evolution_stage == "puppy"
    assert len(soul.memories) == 0


def test_apply_drift():
    soul = PuppySoul(id=str(uuid.uuid4()), name="测试狗")
    changes = {"chaos": 10.0, "loyalty": -5.0}
    
    soul.apply_drift(changes)
    
    assert soul.traits.chaos > 85.0
    assert soul.traits.loyalty < 65.0
    assert soul.experience > 0


def test_interaction_result():
    soul = PuppySoul(id=str(uuid.uuid4()), name="测试")
    result = InteractionResult(
        soul=soul,
        response="汪汪！今天很开心~",
        trait_changes={"affection": 8.0}
    )
    assert result.memory_injected is True
    assert "affection" in result.trait_changes
