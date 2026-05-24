from datetime import datetime
from models import PuppySoul, InteractionResult, EvolutionResult, PetMemory
from agents import TraitDriftAgent, MemoryWeaver, ResponseGenerator
import uuid

class SoulOrchestrator:
    def __init__(self):
        self.trait_agent = TraitDriftAgent()
        self.memory_weaver = MemoryWeaver()
        self.response_generator = ResponseGenerator()
        self.souls = {}  # 内存缓存，生产环境换 Redis/Qdrant

    async def get_soul(self, soul_id: str) -> PuppySoul | None:
        if soul_id in self.souls:
            return self.souls[soul_id]
        # 模拟从数据库加载（后续可换真实存储）
        return None

    async def save_soul(self, soul: PuppySoul):
        self.souls[soul.id] = soul
        # TODO: 持久化到 Qdrant / Supabase

    async def process_interaction(self, soul_id: str, action: str, content: str) -> InteractionResult:
        soul = await self.get_soul(soul_id)
        if not soul:
            soul = PuppySoul(id=soul_id, name="狂暴小狗")

        # 记忆织入
        memory = PetMemory(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            type="interaction",
            content=content,
            impact=8.0,
            mood_delta=12.0
        )
        soul.memories.append(memory)
        soul.total_interactions += 1
        soul.last_active = datetime.utcnow()

        # Trait 漂移
        trait_changes = self.trait_agent.drift(soul.traits, content)

        # 生成回复
        response = self.response_generator.generate(soul, content, action)

        # 经验值增长
        soul.experience += 25

        await self.save_soul(soul)

        return InteractionResult(
            soul=soul,
            response=response,
            trait_changes=trait_changes,
            memory_injected=True
        )

    async def evolve_soul(self, soul_id: str) -> EvolutionResult:
        soul = await self.get_soul(soul_id)
        if not soul:
            raise ValueError("Soul not found")

        old_level = soul.level
        soul.experience += 120
        soul.level = min(30, soul.level + 1)

        level_up = soul.level > old_level

        if soul.level >= 15 and soul.evolution_stage == "puppy":
            soul.evolution_stage = "rebel"
        elif soul.level >= 25:
            soul.evolution_stage = "legend"

        # 大幅性格漂移
        trait_summary = self.trait_agent.major_drift(soul.traits)

        await self.save_soul(soul)

        return EvolutionResult(
            soul=soul,
            level_up=level_up,
            new_stage=soul.evolution_stage,
            trait_summary=trait_summary
        )

    async def warmup(self):
        print("🔥 Soul Orchestrator 预热完成 - 疯狗随时可叛变")
