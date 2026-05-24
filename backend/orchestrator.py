from datetime import datetime
import uuid
from typing import Dict, List
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from models import PuppySoul, InteractionResult, SoulEvent, PetMemory
from database import SessionLocal, SoulDB, qdrant_client
import json

# ====================== AGENTS ======================
class BaseAgent:
    async def run(self, soul: PuppySoul, input_data: str) -> Dict:
        raise NotImplementedError

class TraitDriftAgent(BaseAgent):
    async def run(self, soul: PuppySoul, input_data: str) -> Dict:
        # LLM 调用模拟（实际接 LiteLLM / OpenAI）
        drift = {
            "chaos": 8 if "bad" in input_data.lower() else -3,
            "curiosity": 12 if "explore" in input_data.lower() else 2,
            "rebellion": 15 if "no" in input_data.lower() else -5
        }
        return {"drift": drift, "agent": "TraitDriftAgent"}

class MemoryWeaver(BaseAgent):
    async def run(self, soul: PuppySoul, input_data: str) -> Dict:
        memory = PetMemory(
            type="interaction",
            content=input_data[:200],
            impact=0.8,
            mood_delta=5.0,
            source_agent="MemoryWeaver"
        )
        return {"memory": memory, "agent": "MemoryWeaver"}

class RebelEvaluator(BaseAgent):
    async def run(self, soul: PuppySoul, input_data: str) -> Dict:
        rebellion_boost = 25 if soul.traits.chaos > 70 else 5
        return {"rebellion_delta": rebellion_boost, "agent": "RebelEvaluator"}

# ====================== LANGGRAPH STATE ======================
class SoulState(Dict):
    soul: PuppySoul
    input: str
    events: List[SoulEvent]
    response: str = ""

# ====================== ORCHESTRATOR ======================
class SoulOrchestrator:
    def __init__(self):
        self.workflow = self._build_graph()
        self.checkpointer = MemorySaver()

    def _build_graph(self):
        graph = StateGraph(SoulState)

        async def drift_node(state: SoulState):
            agent = TraitDriftAgent()
            result = await agent.run(state["soul"], state["input"])
            state["soul"].apply_drift(result["drift"])
            return state

        async def memory_node(state: SoulState):
            agent = MemoryWeaver()
            result = await agent.run(state["soul"], state["input"])
            state["soul"].memories.append(result["memory"])
            return state

        async def rebel_node(state: SoulState):
            agent = RebelEvaluator()
            result = await agent.run(state["soul"], state["input"])
            state["soul"].rebellion_score += result["rebellion_delta"]
            return state

        async def response_node(state: SoulState):
            # 这里接大模型生成真实回应
            state["response"] = f"汪！{state['soul'].name}感受到你的呼唤，{state['input']}..."
            return state

        graph.add_node("drift", drift_node)
        graph.add_node("memory", memory_node)
        graph.add_node("rebel", rebel_node)
        graph.add_node("response", response_node)

        graph.set_entry_point("drift")
        graph.add_edge("drift", "memory")
        graph.add_edge("memory", "rebel")
        graph.add_edge("rebel", "response")
        graph.add_edge("response", END)

        return graph.compile(checkpointer=self.checkpointer)

    async def interact(self, soul_id: str, user_input: str) -> InteractionResult:
        soul = self.get_soul(soul_id)
        if not soul:
            soul = PuppySoul(id=soul_id, name="NewPuppy")

        initial_state = {"soul": soul, "input": user_input, "events": []}

        # 执行完整流程
        final_state = await self.workflow.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": soul_id}}
        )

        # 保存事件
        event = SoulEvent(
            event_id=str(uuid.uuid4()),
            soul_id=soul_id,
            timestamp=datetime.utcnow(),
            event_type="interaction",
            payload={"input": user_input, "final_traits": soul.traits.model_dump()}
        )

        self.save_soul(final_state["soul"])
        self._save_to_qdrant(final_state["soul"], final_state["soul"].memories[-1])

        return InteractionResult(
            soul=final_state["soul"],
            response=final_state["response"],
            trait_changes={k: v for k, v in final_state["soul"].traits.model_dump().items()},
            memory_injected=True
        )

    # 保留原有 get_soul / save_soul（优化版）
    def get_soul(self, soul_id: str) -> PuppySoul | None:
        # ... 保持原有逻辑，省略以节省空间
        pass

    def save_soul(self, soul: PuppySoul):
        # ... 保持原有逻辑
        pass

    def _save_to_qdrant(self, soul: PuppySoul, memory: PetMemory):
        if memory.embedding is None:
            memory.embedding = [0.1] * 1536  # 实际用 embedding model
        qdrant_client.upsert(
            collection_name="puppy_memories",
            points=[{
                "id": memory.id,
                "vector": memory.embedding,
                "payload": memory.model_dump()
            }]
        )
