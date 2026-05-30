from .base_agent import BaseAgent
from typing import Dict, Any
from config import settings
from models import PuppySoul

class DiagnosisAgent(BaseAgent):
    def __init__(self):
        super().__init__("DiagnosisAgent")

    async def run(self, soul: PuppySoul, input_data: Dict[str, Any]) -> Dict:
        visual = input_data.get("visual_features", {})
        context = input_data.get("context", "")

        prompt = f"作为专业宠物健康诊断Agent，基于以下信息给出详细诊断：\n视觉特征: {visual}\n行为上下文: {context}"

        diagnosis_raw = await self._call_llm(prompt, response_format=None)

        risk_level = 7 if any(word in diagnosis_raw.lower() for word in ["异常", "危险", "问题"]) else 3

        return {
            "agent": self.name,
            "diagnosis": diagnosis_raw,
            "risk_level": risk_level,
            "visual_insights": visual
        }

    async def analyze(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """简化分析接口（供 SwarmOrchestrator 使用）"""
        visual = input_data.get("image_bytes", b"")
        event = input_data.get("event", "")
        
        # 模拟诊断结果
        risk_level = 3  # 默认低风险
        confidence = 0.85
        
        return {
            "diagnosis": f"基于事件 '{event}' 的健康评估正常",
            "risk_level": risk_level,
            "confidence": confidence,
            "suggestions": ["保持当前互动频率", "定期记录行为数据"]
        }

    async def generate_report(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成诊断报告（供测试使用）"""
        traits = analysis_data.get("traits", [])
        health_score = analysis_data.get("health_score", 50)
        
        # 根据特质计算风险等级
        risk_level = "low"
        if "anxious" in traits or health_score < 50:
            risk_level = "medium"
        if health_score < 30:
            risk_level = "high"
        
        return {
            "soul_traits": traits,
            "risk_level": risk_level,
            "drift_prediction": {
                "predicted_changes": {"energy": 0.05, "loyalty": 0.02},
                "confidence": 0.78
            }
        }
