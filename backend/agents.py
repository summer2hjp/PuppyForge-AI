import random
from models import PetTraits
from typing import Dict, List

class TraitDriftAgent:
    """性格漂移引擎 - 核心叛逆模块"""
    
    def drift(self, traits: PetTraits, input_text: str) -> Dict[str, float]:
        changes = {}
        text_lower = input_text.lower()
        
        # 根据输入关键词进行定向漂移
        if any(word in text_lower for word in ["玩", "跑", "冒险", "刺激"]):
            changes["chaos"] = random.uniform(3, 8)
            changes["curiosity"] = random.uniform(4, 9)
        elif any(word in text_lower for word in ["抱", "爱", "摸"]):
            changes["affection"] = random.uniform(5, 12)
            changes["loyalty"] = random.uniform(2, 7)
        elif any(word in text_lower for word in ["打", "坏", "生气"]):
            changes["aggression"] = random.uniform(4, 10)
        
        # 随机微漂移
        for key in traits.model_fields.keys():
            if key not in changes:
                changes[key] = random.uniform(-3, 4)
            
            # 应用变化
            current = getattr(traits, key)
            new_val = max(0, min(100, current + changes[key]))
            setattr(traits, key, new_val)
        
        return changes

    def major_drift(self, traits: PetTraits) -> Dict[str, float]:
        """进化时的大漂移"""
        summary = {}
        for key in traits.model_fields.keys():
            drift = random.uniform(8, 18)
            current = getattr(traits, key)
            new_val = max(0, min(100, current + drift))
            setattr(traits, key, new_val)
            summary[key] = round(new_val, 1)
        return summary


class MemoryWeaver:
    """记忆织造 Agent"""
    def weave_summary(self, memories: List) -> str:
        if not memories:
            return "这只疯狗刚刚出生，还没有多少记忆..."
        return f"已积累 {len(memories)} 条灵魂记忆，性格正在剧烈漂移中..."


class ResponseGenerator:
    """回复生成器（后续可换大模型）"""
    def generate(self, soul: 'PuppySoul', user_input: str, action: str) -> str:
        stage_emoji = {"puppy": "🐶", "rebel": "🐕‍🦺", "legend": "🌌"}.get(soul.evolution_stage, "🐕")
        
        responses = [
            f"{stage_emoji} 汪！{user_input}？我已经准备好跟你一起叛变了！",
            f"（尾巴狂摇）{user_input} 听起来超有趣！我的混沌值又上升了！",
            f"灵魂共振... 我感受到你了！{user_input}",
        ]
        return random.choice(responses)
