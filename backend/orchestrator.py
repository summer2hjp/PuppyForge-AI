from datetime import datetime
import uuid
from models import PuppySoul, InteractionResult, EvolutionResult, PetMemory, PetTraits
from agents import TraitDriftAgent, ResponseGenerator
from database import SessionLocal, SoulDB, qdrant_client
from sqlalchemy.orm import Session

class SoulOrchestrator:
    def __init__(self):
        self.trait_agent = TraitDriftAgent()
        self.response_generator = ResponseGenerator()

    def get_soul(self, soul_id: str) -> PuppySoul | None:
        db: Session = SessionLocal()
        try:
            soul_db = db.query(SoulDB).filter(SoulDB.id == soul_id).first()
            if not soul_db:
                return None

            return PuppySoul(
                id=soul_db.id,
                name=soul_db.name,
                level=soul_db.level,
                experience=soul_db.experience,
                traits=PetTraits.model_validate(soul_db.traits),
                last_active=soul_db.last_active,
                total_interactions=soul_db.total_interactions,
                evolution_stage=soul_db.evolution_stage,
                memories=[]  # 可后续从 Qdrant 加载
            )
        finally:
            db.close()

    def save_soul(self, soul: PuppySoul):
        db: Session = SessionLocal()
        try:
            soul_db = db.query(SoulDB).filter(SoulDB.id == soul.id).first()
            
            if soul_db:
                soul_db.level = soul.level
                soul_db.experience = soul.experience
                soul_db.traits = soul.traits.model_dump()
                soul_db.last_active = soul.last_active
                soul_db.total_interactions = soul.total_interactions
                soul_db.evolution_stage = soul.evolution_stage
            else:
                soul_db = SoulDB(
                    id=soul.id,
                    name=soul.name,
                    level=soul.level,
                    experience=soul.experience,
                    traits=soul.traits.model_dump(),
                    last_active=soul.last_active,
                    total_interactions=soul.total_interactions,
                    evolution_stage=soul.evolution_stage
                )
                db.add(soul_db)
            
            db.commit()
        finally:
            db.close()

    async def process_interaction(self, soul_id: str, action: str, content: str) -> InteractionResult:
        soul = self.get_soul(soul_id)
        if not soul:
            soul = PuppySoul(id=soul_id, name="狂暴小狗")

        # 创建记忆
        memory = PetMemory(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            type="interaction",
            content=content,
            impact=8.0 + (soul.level * 0.5),
            mood_delta=10.0,
        )
        soul.memories.append(memory)
        soul.total_interactions += 1
        soul.last_active = datetime.utcnow()

        # 性格漂移
        trait_changes = self.trait_agent.drift(soul.traits, content)

        # 生成回复
        response = self.response_generator.generate(soul, content, action)

        # 增加经验
        soul.experience += 25

        self.save_soul(soul)

        return InteractionResult(
            soul=soul,
            response=response,
            trait_changes=trait_changes,
            memory_injected=True
        )

    async def evolve_soul(self, soul_id: str) -> EvolutionResult:
        soul = self.get_soul(soul_id)
        if not soul:
            raise ValueError("Soul not found")

        old_level = soul.level
        soul.experience += 150
        soul.level = min(30, soul.level + 1)

        level_up = soul.level > old_level

        if soul.level >= 15 and soul.evolution_stage == "puppy":
            soul.evolution_stage = "rebel"
        elif soul.level >= 25:
            soul.evolution_stage = "legend"

        trait_summary = self.trait_agent.major_drift(soul.traits)

        self.save_soul(soul)

        return EvolutionResult(
            soul=soul,
            level_up=level_up,
            new_stage=soul.evolution_stage,
            trait_summary=trait_summary
        )
