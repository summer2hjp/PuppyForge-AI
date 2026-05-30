# models/__init__.py
# 先导入 PuppySoul，再导入 User，避免循环依赖
from .models import (
    PetTraits,
    PetMemory,
    EvolutionStage,
    PuppySoul,
    PuppySoulCreate,
    PuppySoulRead,
    PuppySoulUpdate,
    SoulEvent,
    InteractionResult,
    ErrorResponse,
    TraitDriftRequest,
)
from .auth import User, UserRole, UserCreate, UserRead, Token, TokenData

__all__ = [
    # Models - 必须先导出
    "PetTraits", "PetMemory", "EvolutionStage",
    "PuppySoul", "PuppySoulCreate", "PuppySoulRead", "PuppySoulUpdate",
    "SoulEvent", "InteractionResult", "ErrorResponse",
    "TraitDriftRequest",
    # Auth - 后导出，依赖 PuppySoul
    "User", "UserRole", "UserCreate", "UserRead", "Token", "TokenData",
]
