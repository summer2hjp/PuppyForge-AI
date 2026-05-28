# backend/tests/unit/test_vision.py
import pytest
from unittest.mock import patch, AsyncMock
from vision.soul_diagnosis import SoulVisionDiagnoser, VisionAnalysisResult
from models import PuppySoul


@pytest.fixture
def mock_vision_processor():
    with patch('vision.soul_diagnosis.SoulVisionDiagnoser') as mock_class:
        instance = mock_class.return_value
        instance.analyze_image = AsyncMock(return_value=VisionAnalysisResult(
            breed_confidence=0.92,
            emotion="happy",
            health_indicators=["clear_eyes", "shiny_fur"],
            soul_score=88.5
        ))
        yield instance


@pytest.mark.asyncio
async def test_vision_analysis_success(mock_vision_processor):
    diagnoser = SoulVisionDiagnoser()
    
    result = await diagnoser.analyze_image(
        image_bytes=b"fake_image_data",  # 模拟图片字节
        soul_id="soul_test_001"
    )
    
    assert result is not None
    assert result.breed_confidence > 0.8
    assert result.emotion in ["happy", "sad", "energetic", "calm"]
    assert len(result.health_indicators) > 0
    assert 0 <= result.soul_score <= 100


@pytest.mark.asyncio
async def test_vision_analysis_invalid_image():
    diagnoser = SoulVisionDiagnoser()
    
    with pytest.raises(ValueError):
        await diagnoser.analyze_image(
            image_bytes=None,
            soul_id="soul_test_001"
        )


@pytest.mark.asyncio
async def test_vision_enhance_diagnosis(mock_vision_processor, sample_soul):
    """测试视觉诊断增强普通文本诊断"""
    diagnoser = SoulVisionDiagnoser()
    
    enhanced_result = await diagnoser.enhance_diagnosis(
        soul=sample_soul,
        text_description="小狗很活跃",
        image_bytes=b"fake_image"
    )
    
    assert enhanced_result["soul_score"] > 70
    assert "vision_insights" in enhanced_result
    assert isinstance(enhanced_result["vision_insights"], list)


def test_vision_result_model():
    """Pydantic 模型验证"""
    result = VisionAnalysisResult(
        breed_confidence=0.85,
        emotion="energetic",
        health_indicators=["wet_nose"],
        soul_score=82.0
    )
    
    assert result.breed_confidence == 0.85
    assert result.soul_score == 82.0
