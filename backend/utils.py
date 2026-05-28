from datetime import datetime
import json
from typing import Dict, Any

from backend.config import settings


def generate_soul_name() -> str:
    prefixes = ["Summer", "Luna", "Blaze", "Shadow", "Spark", "Nova"]
    suffixes = ["Pup", "Soul", "Heart", "Byte", "Forge"]
    import random
    return f"{random.choice(prefixes)}{random.choice(suffixes)}"


def calculate_soul_level(experience: int) -> int:
    return max(1, int(experience ** 0.4) // 3 + 1)


def safe_json_dumps(obj: Any) -> str:
    """安全序列化"""
    try:
        return json.dumps(obj, default=str)
    except:
        return json.dumps({"error": "Serialization failed"})


class SoulLogger:
    @staticmethod
    def log_interaction(soul_id: str, action: str, details: Dict):
        print(f"[SOUL] {datetime.utcnow()} | {soul_id} | {action} | {details}")
