from datetime import datetime
import uuid
from typing import Dict, List, Optional, Any
import asyncio
import logging

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from config import settings
from models import (
    PuppySoul, 
    PetMemory, 
    SoulEvent, 
    InteractionResult, 
    PetTraits
)
from database import get_db, get_qdrant_client
from agents import (
    diagnosis_agent,
    growth_agent,
    prediction_agent,
    rebel_agent,
    trait_drift_agent,
    memory_weaver
)

# 导入 SwarmOrchestrator 以便从 orchestrator 模块直接访问
from agents.orchestrator import SwarmOrchestrator

logger = logging.getLogger("puppyforge.orchestrator")


class SoulState(Dict):
    """LangGraph 核心状态"""
    soul: PuppySoul
    user_input: str
    visual_features: Optional[Dict] = None
    context: Optional[Dict] = None
    agent_results: Dict[str, Any] = {}
    final_response: str = ""
    should_rebel: bool = False
    health_risk: int = 0
    events: List[SoulEvent] = []


class SoulOrchestrator:
    def __init__(self):
        self.checkpointer = MemorySaver()
        self.workflow = self._build_graph()
        self.active_souls_cache: Dict[str, PuppySoul] = {}

    def _build_graph(self):
        """构建高级 LangGraph 工作流"""
        graph = StateGraph(SoulState)

        # ==================== 并行 Agent 节点 ====================
        async def trait_drift_node(state: SoulState):
            result = await trait_drift_agent.run(
                state["soul"], 
                {"user_input": state["user_input"]}
            )
            state["agent_results"]["trait_drift"] = result
            return state

        async def memory_weaver_node(state: SoulState):
            result = await memory_weaver.run(
                state["soul"], 
                {"user_input": state["user_input"]}
            )
            state["agent_results"]["memory_weaver"] = result
            return state

        async def diagnosis_node(state: SoulState):
            result = await diagnosis_agent.run(
                state["soul"], 
                {
                    "visual_features": state.get("visual_features"),
                    "context": state.get("context")
                }
            )
            state["agent_results"]["diagnosis"] = result
            state["health_risk"] = result.get("risk_level", 5)
            return state

        async def rebel_node(state: SoulState):
            if state["soul"].rebellion_score > 55 or state["soul"].traits.chaos > 70:
                result = await rebel_agent.run(
                    state["soul"], 
                    {
                        "user_input": state["user_input"],
                        "swarm_result": state["agent_results"]
                    }
                )
                state["agent_results"]["rebel"] = result
                state["should_rebel"] = True
            return state

        async def growth_node(state: SoulState):
            result = await growth_agent.run(state["soul"], {"user_input": state["user_input"]})
            state["agent_results"]["growth"] = result
            return state

        async def prediction_node(state: SoulState):
            result = await prediction_agent.run(state["soul"], {})
            state["agent_results"]["prediction"] = result
            return state

        # ==================== 决策节点 ====================
        async def decision_node(state: SoulState):
            soul = state["soul"]

            if state["health_risk"] >= 7:
                state["final_response"] = f"⚠️ 紧急健康警告：{state['agent_results'].get('diagnosis', {}).get('diagnosis', '')}"
            elif state["should_rebel"] or soul.rebellion_score > 80:
                rebel_sug = state["agent_results"].get("rebel", {}).get("rebel_suggestion", {})
                state["final_response"] = f"😈 {soul.name} 进入叛逆模式！{rebel_sug.get('suggestion', '我想干点刺激的事！')}"
            else:
                growth = state["agent_results"].get("growth", {})
                state["final_response"] = f"🐾 {soul.name} 正在健康成长！{growth.get('growth_plan', '继续陪伴我吧~')}"
            return state

        async def response_node(state: SoulState):
            if not state["final_response"]:
                state["final_response"] = f"汪汪！{state['soul'].name} 的灵魂正在剧烈共振..."
            return state

        # ==================== 节点注册 & 边 ====================
        nodes = {
            "trait_drift": trait_drift_node,
            "memory_weaver": memory_weaver_node,
            "diagnosis": diagnosis_node,
            "rebel": rebel_node,
            "growth": growth_node,
            "prediction": prediction_node,
            "decision": decision_node,
            "response": response_node,
        }

        for name, node in nodes.items():
            graph.add_node(name, node)

        graph.set_entry_point("trait_drift")

        # 并行执行
        graph.add_edge("trait_drift", "memory_weaver")
        graph.add_edge("trait_drift", "diagnosis")
        graph.add_edge("trait_drift", "growth")
        graph.add_edge("trait_drift", "prediction")

        graph.add_edge("diagnosis", "rebel")
        
        # 全部汇聚到决策
        for node in ["memory_weaver", "rebel", "growth", "prediction"]:
            graph.add_edge(node, "decision")

        graph.add_edge("decision", "response")
        graph.add_edge("response", END)

        return graph.compile(checkpointer=self.checkpointer)

    async def interact(
        self, 
        soul_id: str, 
        user_input: str,
        visual_features: Optional[Dict] = None,
        context: Optional[Dict] = None
    ) -> InteractionResult:
        
        # 性能缓存
        soul = self.active_souls_cache.get(soul_id)
        if not soul:
            soul = await self._load_soul(soul_id)
            self.active_souls_cache[soul_id] = soul

        # 输入安全处理
        if len(user_input) > 500:
            user_input = user_input[:500]

        initial_state: SoulState = {
            "soul": soul,
            "user_input": user_input,
            "visual_features": visual_features,
            "context": context,
            "agent_results": {},
            "events": []
        }

        try:
            # 执行工作流 + 超时保护
            final_state = await asyncio.wait_for(
                self.workflow.ainvoke(
                    initial_state,
                    config={"configurable": {"thread_id": soul_id}}
                ),
                timeout=10.0
            )

            # 保存灵魂状态
            await self._save_soul(final_state["soul"])

            # 保存最新记忆到 Qdrant
            if final_state["soul"].memories:
                self._save_to_qdrant(final_state["soul"].memories[-1])

            return InteractionResult(
                soul=final_state["soul"],
                response=final_state["final_response"],
                trait_changes=final_state["soul"].traits.model_dump(),
                agent_insights=final_state["agent_results"],
                memory_injected=True
            )

        except asyncio.TimeoutError:
            logger.warning(f"Soul {soul_id} interaction timeout")
            return InteractionResult(
                soul=soul,
                response="灵魂引擎响应超时... 请再试一次汪！",
                trait_changes=soul.traits.model_dump()
            )
        except Exception as e:
            logger.error(f"Orchestrator error: {e}", exc_info=True)
            raise

    async def _load_soul(self, soul_id: str) -> PuppySoul:
        """从数据库加载灵魂"""
        db = next(get_db())
        # TODO: 实现真实查询逻辑
        soul = db.exec(select(PuppySoul).where(PuppySoul.id == soul_id)).first()
        return soul or PuppySoul(
            id=soul_id,
            name="SummerPuppy",
            traits=PetTraits(),
            soul_fuel=settings.DEFAULT_SOUL_FUEL
        )

    async def _save_soul(self, soul: PuppySoul):
        """保存灵魂状态"""
        # TODO: 实现异步保存
        self.active_souls_cache[soul.id] = soul
        logger.info(f"Soul {soul.name} saved | Rebellion: {soul.rebellion_score:.1f}")

    def _save_to_qdrant(self, memory: PetMemory):
        """向量记忆存储"""
        try:
            qdrant_client.upsert(
                collection_name="puppy_memories",
                points=[{
                    "id": memory.id,
                    "vector": memory.embedding or [0.1] * 1536,
                    "payload": memory.model_dump()
                }]
            )
        except Exception as e:
            logger.error(f"Qdrant save failed: {e}")

    def clear_cache(self):
        """清理缓存"""
        self.active_souls_cache.clear()
