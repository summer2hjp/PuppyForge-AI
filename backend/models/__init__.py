# models/__init__.py
from .auth import User, UserRole, UserCreate, UserRead, Token, TokenData
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

__all__ = [
    # Auth
    "User", "UserRole", "UserCreate", "UserRead", "Token", "TokenData",
    # Models
    "PetTraits", "PetMemory", "EvolutionStage",
    "PuppySoul", "PuppySoulCreate", "PuppySoulRead", "PuppySoulUpdate",
    "SoulEvent", "InteractionResult", "ErrorResponse",
    "TraitDriftRequest",
]
