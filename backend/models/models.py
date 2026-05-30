"""
模型聚合模块
导入所有子模型以确保 SQLModel.metadata.create_all() 能发现所有表定义。
同时提供向后兼容的导入路径。
"""

# 导入核心认证模型
from models.auth import User, UserCreate, UserRead, UserUpdate, UserRole

# 导入业务模型
# 注意：这里导入是为了触发类的定义注册到 SQLModel metadata 中
# 如果这些文件中有循环导入问题，请确保使用 TYPE_CHECKING 或在文件内部延迟导入
try:
    from models.soul import PuppySoul, PuppySoulCreate, PuppySoulRead, PuppySoulUpdate
    from models.interaction import Interaction, InteractionCreate, InteractionRead, InteractionUpdate
    from models.diagnosis import Diagnosis, DiagnosisCreate, DiagnosisRead
except ImportError:
    # 在某些测试场景或初始化阶段，如果子模块尚未准备好，可以暂时忽略
    # 但在生产环境中应确保所有模型文件存在且正确
    pass

# 定义一个显式的列表，方便遍历或检查
__all_models__ = [
    User,
    PuppySoul,
    Interaction,
    Diagnosis
]

# 如果需要向后兼容旧的 imports (例如 from models.models import User)
# 上面的 import 语句已经自动完成了导出
