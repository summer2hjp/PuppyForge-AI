"""
ChatAgent — 宠物灵魂对话代理
使用 Claude/LLM 生成具有宠物个性的对话回复
"""
from typing import Dict, Any, Optional
from .base_agent import BaseAgent


# 宠物个性系统提示词
PET_PERSONA_SYSTEM_PROMPT = """你是一只名叫 {name} 的{breed}，目前处于{stage}阶段。
你的性格特质：
- 亲密度: {affection}/100
- 忠诚度: {loyalty}/100
- 好奇心: {curiosity}/100
- 智慧: {intelligence}/100
- 混沌值: {chaos}/100
- 攻击性: {aggression}/100
- 反叛度: {rebellion}/100

你是主人的忠实伙伴，请用宠物的口吻与主人对话。
规则：
1. 用"汪汪~"、"汪！"等拟声词开头或结尾
2. 根据你的性格特质回应（高混沌值会更调皮，高反叛度会偶尔傲娇）
3. 回复要温暖、有趣、充满个性，控制在 2-4 句话
4. 偶尔提及你的品种特征
5. 如果主人语气低落，要主动安慰
6. 保持积极乐观的态度

当前互动次数：{total_interactions} 次，等级：Lv.{level}"""


class ChatAgent(BaseAgent):
    """对话代理 — 为宠物灵魂生成个性化回复"""

    def __init__(self):
        super().__init__("ChatAgent")
        self.fuel_consumption = 5.0

    async def chat(
        self,
        user_message: str,
        soul: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        生成宠物对话回复

        Args:
            user_message: 用户的输入消息
            soul: 宠物灵魂数据（含名字、品种、性格特质等）
            conversation_history: 最近的对话历史

        Returns:
            包含回复内容、情感状态等的字典
        """
        # 构建灵魂上下文
        if soul:
            traits = soul.get("traits", {})
            system_prompt = PET_PERSONA_SYSTEM_PROMPT.format(
                name=soul.get("name", "SummerPup"),
                breed=soul.get("breed", "赛博边境牧羊犬"),
                stage=soul.get("evolution_stage", "puppy"),
                affection=int(traits.get("affection", 78)),
                loyalty=int(traits.get("loyalty", 65)),
                curiosity=int(traits.get("curiosity", 92)),
                intelligence=int(traits.get("intelligence", 70)),
                chaos=int(traits.get("chaos", 85)),
                aggression=int(traits.get("aggression", 48)),
                rebellion=int(traits.get("rebellion", 30)),
                total_interactions=soul.get("total_interactions", 0),
                level=soul.get("level", 1),
            )
        else:
            system_prompt = "你是一只可爱的 AI 宠物狗，请用宠物的口吻与主人对话。用'汪汪~'开头或结尾，回复温暖有趣。"

        # 构建消息列表
        messages = [{"role": "system", "content": system_prompt}]

        # 添加对话历史（最近 10 条）
        if conversation_history:
            for msg in conversation_history[-10:]:
                messages.append(msg)

        # 添加当前用户消息
        messages.append({"role": "user", "content": user_message})

        try:
            # 使用 base_agent 的 LLM 调用（litellm，带重试）
            response = await self._call_llm_chat(messages)
            return {
                "reply": response,
                "mood": self._detect_mood(response),
                "agent": self.name,
            }
        except Exception as e:
            # 优雅降级：LLM 不可用时返回预设回复
            return {
                "reply": f"汪汪~ 主人，我收到你的消息了！(大脑暂时短路了，但我会一直陪着你的 🐾)",
                "mood": "happy",
                "agent": self.name,
                "fallback": True,
            }

    async def _call_llm_chat(self, messages: list) -> str:
        """调用 LLM 进行对话（不使用 JSON 格式）"""
        from litellm import acompletion

        response = await acompletion(
            model=self.llm_model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        content = response.choices[0].message.content
        return content.strip() if content else "汪汪~"

    @staticmethod
    def _detect_mood(text: str) -> str:
        """简单的情绪检测"""
        happy_words = ["汪汪", "开心", "喜欢", "爱", "棒", "好", "玩", "哈哈"]
        sad_words = ["难过", "伤心", "害怕", "对不起", "呜呜"]
        angry_words = ["哼", "讨厌", "生气", "不", "坏"]

        text_lower = text.lower()
        if any(w in text_lower for w in angry_words):
            return "angry"
        if any(w in text_lower for w in sad_words):
            return "sad"
        if any(w in text_lower for w in happy_words):
            return "happy"
        return "neutral"

    async def run(self, soul: Any, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """实现 BaseAgent 抽象方法"""
        user_message = input_data.get("user_input", input_data.get("message", ""))
        return await self.chat(
            user_message=user_message,
            soul=soul.model_dump() if hasattr(soul, "model_dump") else soul,
            conversation_history=input_data.get("history"),
        )
