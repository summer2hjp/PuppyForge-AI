from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import binascii
import io
from PIL import Image, UnidentifiedImageError
from typing import Optional
from backend.config import settings

# 假设的 VLM 服务客户端（需实现）
# from your_vlm_client import AsyncVLMClient

class SoulDiagnosisService:
    """灵魂视觉诊断服务"""
    
    def __init__(self):
        # self.vlm_client = AsyncVLMClient()
        pass
    
    async def diagnose_image(
        self, 
        soul_id: str, 
        image_base64: str,
        description: Optional[str] = None
    ) -> dict:
        """
        多模态视觉诊断
        
        Args:
            soul_id: 灵魂 ID
            image_base64: Base64 编码的图片
            description: 可选的文字描述
        
        Returns:
            诊断结果包含健康分数、问题识别、建议等
        """
        try:
            # 解码并校验大小
            image_data = base64.b64decode(image_base64, validate=True)
            max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
            if len(image_data) > max_size_bytes:
                raise HTTPException(status_code=413, detail="图片体积超限")

            # 校验图片有效性和类型
            image = Image.open(io.BytesIO(image_data))
            image.verify()
            image = Image.open(io.BytesIO(image_data))
            mime_type = Image.MIME.get(image.format)
            if mime_type not in settings.ALLOWED_IMAGE_TYPES:
                raise HTTPException(status_code=400, detail="不支持的图片类型")
            
            # 构建诊断 prompt
            prompt = f"""
            你是一只 AI 宠物医生的助手。请分析这张宠物照片：
            
            1. 识别宠物的品种、年龄阶段
            2. 评估健康状况（毛色、皮肤、眼睛、姿态等）
            3. 识别潜在健康问题
            4. 给出护理建议
            
            {f'额外信息：{description}' if description else ''}
            
            请以 JSON 格式返回：
            {{
                "breed": "品种",
                "health_score": 0-100,
                "issues": ["问题列表"],
                "recommendations": ["建议列表"],
                "emotional_state": "情绪状态",
                "summary": "详细分析总结"
            }}
            """
            
            # TODO: 调用实际 VLM 服务
            # result = await self.vlm_client.analyze(image, prompt)
            
            # 模拟返回（开发测试用）
            return {
                "soul_id": soul_id,
                "breed": "金毛寻回犬",
                "health_score": 85,
                "issues": ["轻微皮肤干燥"],
                "recommendations": [
                    "增加 Omega-3 补充剂",
                    "保持适度运动",
                    "定期梳理毛发"
                ],
                "emotional_state": "开心活跃",
                "summary": "宠物整体健康状况良好，毛色光亮，眼神有神。注意到轻微皮肤干燥，建议使用保湿护理产品。"
            }
            
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=400, detail="无效的 base64 图片数据")
        except (UnidentifiedImageError, OSError):
            raise HTTPException(status_code=400, detail="无效的图片文件")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"视觉诊断失败：{str(e)}"
            )


# 创建单例服务
diagnosis_service = SoulDiagnosisService()


# FastAPI 路由
router = APIRouter(prefix="/vision", tags=["vision"])


class DiagnoseRequest(BaseModel):
    soul_id: str
    image: str
    description: Optional[str] = None


@router.post("/diagnose")
async def diagnose(payload: DiagnoseRequest):
    """
    视觉诊断接口
    前端调用示例：
    ```ts
    const result = await fetch('/api/vision/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        soul_id: 'xxx',
        image: base64String,
        description: '体检'
      })
    })
    ```
    """
    result = await diagnosis_service.diagnose_image(payload.soul_id, payload.image, payload.description)
    return result
