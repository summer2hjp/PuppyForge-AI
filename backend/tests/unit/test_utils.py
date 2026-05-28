# backend/tests/unit/test_utils.py
import pytest
from utils import generate_soul_name, calculate_soul_level, safe_json_dumps
from datetime import datetime


def test_generate_soul_name():
    name = generate_soul_name()
    assert isinstance(name, str)
    assert len(name) > 5
    assert any(prefix in name for prefix in ["Summer", "Luna", "Blaze"])


def test_calculate_soul_level():
    assert calculate_soul_level(0) == 1
    assert calculate_soul_level(100) >= 1
    assert calculate_soul_level(10000) > 5


def test_safe_json_dumps():
    data = {"soul": "小奶豆", "level": 3}
    json_str = safe_json_dumps(data)
    assert isinstance(json_str, str)
    assert "小奶豆" in json_str


@pytest.mark.parametrize("exp,expected_min", [(0, 1), (1000, 2), (10000, 5)])
def test_level_progression(exp, expected_min):
    level = calculate_soul_level(exp)
    assert level >= expected_min
