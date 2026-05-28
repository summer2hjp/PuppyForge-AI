# backend/tests/unit/test_utils.py
import pytest
from utils import generate_soul_id, get_time_based_greeting, calculate_soul_score


def test_generate_soul_id():
    """灵魂ID生成测试"""
    soul_id = generate_soul_id("小奶豆", "summer2hjp")
    assert soul_id.startswith("soul_")
    assert len(soul_id) > 15
    assert "smallmilk" in soul_id.lower() or "奶豆" in soul_id


def test_time_based_greeting():
    """时间问候语测试"""
    greeting = get_time_based_greeting()
    valid_greetings = ["早上好", "中午好", "下午好", "晚上好", "汪汪"]
    assert any(g in greeting for g in valid_greetings)


def test_calculate_soul_score():
    """灵魂分数计算测试"""
    traits = {"loyalty": 85, "chaos": 60, "curiosity": 90}
    score = calculate_soul_score(traits)
    assert 0 <= score <= 100
    assert isinstance(score, (int, float))


@pytest.mark.parametrize("level,expected", [
    (0, "puppy"),
    (5, "young"),
    (12, "adult")
])
def test_evolution_stage(level, expected):
    from utils import get_evolution_stage
    assert get_evolution_stage(level) == expected
