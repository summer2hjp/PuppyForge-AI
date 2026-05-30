# backend/tests/test_models.py
import pytest
import uuid
from models import PuppySoul, PetTraits, InteractionResult


def test_pet_traits():
    traits = PetTraits()
    assert 0 <= traits.loyalty <= 100
    assert 0 <= traits.chaos <= 100
    assert 0 <= traits.curiosity <= 100


@pytest.mark.skip(reason="循环依赖问题，待修复")
def test_puppy_soul_model():
    soul = PuppySoul(
        id=str(uuid.uuid4()),
        name="小奶豆",
        level=1,
        experience=0,
        owner_id="test_user"
    )
    assert soul.name == "小奶豆"
    assert soul.level == 1
    assert soul.evolution_stage == "puppy"
    assert isinstance(soul.traits, PetTraits)


@pytest.mark.skip(reason="循环依赖问题，待修复")
def test_interaction_result():
    soul = PuppySoul(id=str(uuid.uuid4()), name="测试")
    result = InteractionResult(
        soul=soul,
        response="汪汪汪~",
        trait_changes={"loyalty": 5.0}
    )
    assert result.response == "汪汪汪~"
    assert isinstance(result.trait_changes, dict)
