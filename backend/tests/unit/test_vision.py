# backend/tests/unit/test_vision.py
import pytest
from unittest.mock import patch, AsyncMock
from vision.soul_diagnosis import SoulDiagnosisService


@pytest.fixture
def mock_diagnosis_service():
    with patch('vision.soul_diagnosis.SoulDiagnosisService') as mock_class:
        instance = mock_class.return_value
        instance.diagnose_image = AsyncMock(return_value={
            "soul_score": 88.5,
            "emotion": "happy",
            "health_indicators": ["clear_eyes", "shiny_fur"],
            "suggestions": ["多运动"]
        })
        yield instance


@pytest.mark.asyncio
async def test_diagnose_image_success(mock_diagnosis_service):
    service = SoulDiagnosisService()
    
    result = await service.diagnose_image(
        soul_id="soul_test_001",
        image_base64="data:image/jpeg;base64,/fakebase64data",
        description="活泼的小狗"
    )
    
    assert result is not None
    assert result["soul_score"] > 0
    assert "emotion" in result


@pytest.mark.asyncio
async def test_diagnose_image_invalid_base64():
    service = SoulDiagnosisService()
    
    with pytest.raises(Exception):  # 实际会抛出 base64 或 HTTPException
        await service.diagnose_image(
            soul_id="soul_test_001",
            image_base64="invalid_base64",
        )
