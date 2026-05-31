"""
此模块负责导入并注册所有 SQLModel 模型类。
导入顺序至关重要：必须先导入基础模型（如 User），再导入依赖它们的模型。
"""
# 1. 导入核心认证模型 (无外部模型依赖)
from models.auth import User, UserCreate, UserRead, UserUpdate, UserRole

# 2. 导入业务模型
# 注意：这些模块内部通过 TYPE_CHECKING 处理了循环导入问题
from models.soul import PuppySoul, PuppySoulCreate, PuppySoulRead, PuppySoulUpdate
from models.interaction import Interaction, InteractionCreate, InteractionRead, InteractionUpdate
from models.diagnosis import Diagnosis, DiagnosisCreate, DiagnosisRead

# 3. 导入 Pydantic 模型 (从 models.py)
from models.models import PetMemory, PetTraits, PuppySoul as PydanticPuppySoul, SoulEvent, InteractionResult, ErrorResponse

# 4. 显式导出所有公开符号，方便外部使用 (如: from models import User)
__all__ = [
    # Auth
    "User",
    "UserCreate",
    "UserRead",
    "UserUpdate",
    "UserRole",
    
    # Soul (SQLModel)
    "PuppySoul",
    "PuppySoulCreate",
    "PuppySoulRead",
    "PuppySoulUpdate",
    
    # Interaction
    "Interaction",
    "InteractionCreate",
    "InteractionRead",
    "InteractionUpdate",
    
    # Diagnosis
    "Diagnosis",
    "DiagnosisCreate",
    "DiagnosisRead",
    
    # Pydantic Models
    "PetMemory",
    "PetTraits",
    "SoulEvent",
    "InteractionResult",
    "ErrorResponse",
]
