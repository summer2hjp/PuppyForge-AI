# backend/tests/unit/test_vision.py
import pytest
from unittest.mock import patch, AsyncMock
from vision.soul_diagnosis import SoulDiagnosisService  # 根据实际结构调整


@pytest.fixture
def mock_vision_service():
    with patch('vision.soul_diagnosis.SoulDiagnosisService') as mock_class:
        instance = mock_class.return_value
        instance.diagnose = AsyncMock(return_value={
            "soul_score": 87.5,
            "emotion": "happy",
            "breed": "柯基",
            "health_status": "good",
            "suggestions": ["多陪它玩耍"]
        })
        yield instance


@pytest.mark.asyncio
async def test_vision_diagnose_success(mock_vision_service):
    """视觉诊断核心功能测试"""
    service = SoulDiagnosisService()
    
    result = await service.diagnose(
        image_base64="data:image/jpeg;base64,fakebase64data123",
        description="一只活泼的柯基在草地上奔跑",
        soul_id="soul_test_001"
    )
    
    assert result is not None
    assert result["soul_score"] > 70
    assert "emotion" in result
    assert "suggestions" in result


@pytest.mark.asyncio
async def test_vision_invalid_image():
    """无效图片处理测试"""
    service = SoulDiagnosisService()
    
    with pytest.raises((ValueError, Exception)):
        await service.diagnose(
            image_base64=None,
            description="测试",
            soul_id="soul_test_001"
        )
