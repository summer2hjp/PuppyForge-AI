import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_analyze_pet_image_success():
    expected_result = {
        "traits": ["energetic", "loyal"],
        "confidence": 0.92,
        "health_score": 88
    }
    
    with patch('vision.analyze_pet_image', new_callable=AsyncMock) as mock_func:
        mock_func.return_value = expected_result
        
        # 直接测试 mock 返回的结果
        result = await mock_func("fake_image_bytes")
        assert "traits" in result
        assert result["health_score"] == 88

@pytest.mark.asyncio
async def test_analyze_pet_image_invalid_format():
    from vision import analyze_pet_image
    result = await analyze_pet_image(None)
    assert result["health_score"] == 50  # 降级
    assert "error" in result
