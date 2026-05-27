import pytest
from backend.vision import analyze_pet_image

@pytest.mark.asyncio
async def test_analyze_pet_image_success(mock_analyze_image):
    mock_analyze_image.return_value = {
        "traits": ["energetic", "loyal"],
        "confidence": 0.92,
        "health_score": 88
    }

    result = await analyze_pet_image("fake_image_bytes")
    assert "traits" in result
    assert result["health_score"] == 88

@pytest.mark.asyncio
async def test_analyze_pet_image_invalid_format():
    result = await analyze_pet_image(None)
    assert result["health_score"] == 50  # 降级
    assert "error" in result
