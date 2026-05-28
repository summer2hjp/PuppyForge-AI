# backend/tests/unit/test_utils.py
import pytest
from utils import calculate_trait_score, normalize_image, generate_soul_id
from datetime import datetime


def test_calculate_trait_score():
    traits = {"loyalty": 80, "chaos": 60, "curiosity": 90}
    score = calculate_trait_score(traits)
    assert 0 <= score <= 100
    assert isinstance(score, float)


def test_generate_soul_id():
    soul_id = generate_soul_id("小奶豆", "testuser")
    assert soul_id.startswith("soul_")
    assert len(soul_id) > 10


def test_normalize_image():
    # 测试图片归一化（模拟）
    fake_image = b"fake_image_bytes"
    normalized = normalize_image(fake_image)
    assert normalized is not None


def test_time_based_greeting():
    from utils import get_time_based_greeting
    greeting = get_time_based_greeting()
    assert greeting in ["早上好", "中午好", "下午好", "晚上好"]


@pytest.mark.parametrize("level,expected_stage", [
    (1, "puppy"),
    (5, "young"),
    (10, "adult"),
    (20, "senior")
])
def test_evolution_stage(level, expected_stage):
    from utils import get_evolution_stage
    assert get_evolution_stage(level) == expected_stage
