# backend/tests/test_models.py
import pytest
from datetime import datetime
import uuid
from models import PuppySoul, PetTraits, InteractionResult, User


def test_pet_traits_default_values():
    """测试 PetTraits 默认值"""
    traits = PetTraits()
    assert traits.loyalty == 70.0
    assert traits.chaos == 60.0
    assert traits.curiosity == 85.0
    assert traits.affection == 75.0
    assert all(0 <= getattr(traits, t) <= 100 for t in ["loyalty", "chaos", "curiosity", "affection"])


def test_puppy_soul_creation():
    """测试 PuppySoul 创建"""
    soul_id = str(uuid.uuid4())
    soul = PuppySoul(
        id=soul_id,
        name="小奶豆",
        owner_id="user_test_001",
        level=1,
        experience=0
    )
    
    assert soul.id == soul_id
    assert soul.name == "小奶豆"
    assert soul.level == 1
    assert soul.evolution_stage == "puppy"
    assert len(soul.memories) == 0
    assert isinstance(soul.traits, PetTraits)


def test_puppy_soul_apply_drift():
    """测试特质漂移"""
    soul = PuppySoul(
        id=str(uuid.uuid4()),
        name="测试狗",
        traits=PetTraits(loyalty=80.0, chaos=50.0)
    )
    
    initial_loyalty = soul.traits.loyalty
    initial_chaos = soul.traits.chaos
    
    soul.apply_drift({"loyalty": -8.0, "chaos": 12.0})
    
    assert soul.traits.loyalty < initial_loyalty
    assert soul.traits.chaos > initial_chaos
    assert soul.experience > 0


def test_interaction_result_creation():
    """测试交互结果模型"""
    soul = PuppySoul(id=str(uuid.uuid4()), name="测试")
    result = InteractionResult(
        soul=soul,
        response="汪汪！今天好开心呀~",
        trait_changes={"affection": 15.0, "curiosity": 5.0},
        memory_injected=True
    )
    
    assert result.soul == soul
    assert "affection" in result.trait_changes
    assert result.memory_injected is True


def test_user_model():
    """测试 User 模型"""
    user = User(
        id="user_test_001",
        email="test@puppyforge.ai",
        username="summer2hjp",
        is_active=True
    )
    
    assert user.email == "test@puppyforge.ai"
    assert user.is_active is True
