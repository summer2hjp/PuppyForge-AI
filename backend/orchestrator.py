from datetime import datetime
import uuid
from typing import Dict, List, Any, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode
import asyncio

from models import PuppySoul, PetMemory, SoulEvent, InteractionResult
from database import SessionLocal, SoulDB, qdrant_client
from agents import (
    diagnosis_agent, growth_agent, prediction_agent,
    rebel_agent, trait_drift_agent, memory_weaver
)


class SoulState(Dict):
    """LangGraph 核心状态"""
    soul: PuppySoul
    user_input: str
    visual_features: Optional[Dict] = None
    context: Optional[Dict] = None
    events: List[SoulEvent] = []
    agent_results: Dict[str, Any] = {}
    final_response: str = ""
    should_rebel: bool = False
    health_risk: int = 0


class SoulOrchestrator:
    def __init__(self):
        self.checkpointer = MemorySaver()
        self.workflow = self._build_advanced_graph()

    def _build_advanced_graph(self):
        graph = StateGraph(SoulState)

        # ==================== 并行节点定义 ====================
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
            # 条件触发：高叛逆或高混乱时加强
            if state["soul"].rebellion_score > 60 or state["soul"].traits.chaos > 75:
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
            """条件分支决策"""
            soul = state["soul"]
            
            # 高风险健康问题 → 优先诊断路径
            if state["health_risk"] >= 7:
                state["final_response"] = f"⚠️ 紧急诊断：{state['agent_results'].get('diagnosis', {}).get('diagnosis')}"
                return state

            # 极高叛逆 → 叛逆路径
            if state["should_rebel"] or soul.rebellion_score > 85:
                rebel_sug = state["agent_results"].get("rebel", {}).get("rebel_suggestion", {})
                state["final_response"] = f"😈 {soul.name}决定叛逆！建议：{rebel_sug.get('suggestion', '玩点刺激的！')}"
                return state

            # 正常成长路径
            growth = state["agent_results"].get("growth", {})
            state["final_response"] = f"🐾 {soul.name}正在成长！{growth.get('growth_plan', '继续努力汪！')}"
            return state

        async def response_synthesis_node(state: SoulState):
            """最终回应合成（可接入大模型）"""
            if not state["final_response"]:
                state["final_response"] = await self._synthesize_response(state)
            return state

        # ==================== 节点注册 ====================
        graph.add_node("trait_drift", trait_drift_node)
        graph.add_node("memory_weaver", memory_weaver_node)
        graph.add_node("diagnosis", diagnosis_node)
        graph.add_node("rebel", rebel_node)
        graph.add_node("growth", growth_node)
        graph.add_node("prediction", prediction_node)
        graph.add_node("decision", decision_node)
        graph.add_node("response", response_synthesis_node)

        # ==================== 边与流程控制 ====================
        graph.set_entry_point("trait_drift")

        # 并行执行核心Agent
        graph.add_edge("trait_drift", "memory_weaver")
        graph.add_edge("trait_drift", "diagnosis")
        graph.add_edge("trait_drift", "prediction")
        graph.add_edge("trait_drift", "growth")

        # 叛逆Agent在诊断后条件执行
        graph.add_edge("diagnosis", "rebel")

        # 全部汇聚到决策节点
        graph.add_edge("memory_weaver", "decision")
        graph.add_edge("rebel", "decision")
        graph.add_edge("growth", "decision")
        graph.add_edge("prediction", "decision")

        graph.add_edge("decision", "response")
        graph.add_edge("response", END)

        return graph.compile(checkpointer=self.checkpointer)

    async def _synthesize_response(self, state: SoulState) -> str:
        """最终回应生成（可替换为 LiteLLM 大模型调用）"""
        soul = state["soul"]
        return f"汪汪！{soul.name}（Lv.{soul.level}）感受到你的存在，灵魂正在剧烈漂移... " \
               f"当前叛逆值: {soul.rebellion_score:.1f} | 燃料剩余: {soul.soul_fuel:.1f}"

    async def interact(self, soul_id: str, user_input: str, 
                      visual_features: Optional[Dict] = None,
                      context: Optional[Dict] = None) -> InteractionResult:
        
        soul = self.get_soul(soul_id)
        if not soul:
            soul = PuppySoul(id=soul_id, name="SummerPuppy")

        initial_state: SoulState = {
            "soul": soul,
            "user_input": user_input,
            "visual_features": visual_features,
            "context": context,
            "events": [],
            "agent_results": {}
        }

        # 执行完整LangGraph工作流
        final_state = await self.workflow.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": soul_id}}
        )

        # 保存事件溯源
        event = SoulEvent(
            event_id=str(uuid.uuid4()),
            soul_id=soul_id,
            timestamp=datetime.utcnow(),
            event_type="full_interaction",
            payload={
                "input": user_input,
                "final_traits": final_state["soul"].traits.model_dump(),
                "rebellion": final_state["soul"].rebellion_score,
                "agents_used": list(final_state["agent_results"].keys())
            }
        )

        self.save_soul(final_state["soul"])
        self._save_memory_to_qdrant(final_state["soul"])

        return InteractionResult(
            soul=final_state["soul"],
            response=final_state["final_response"],
            trait_changes=final_state["soul"].traits.model_dump(),
            memory_injected=True,
            agent_insights=final_state["agent_results"]
        )

    # ==================== 数据库辅助方法 ====================
    def get_soul(self, soul_id: str) -> Optional[PuppySoul]:
        # TODO: 实现从DB读取（保持原有逻辑）
        return None

    def save_soul(self, soul: PuppySoul):
        # TODO: 实现保存逻辑
        pass

    def _save_memory_to_qdrant(self, soul: PuppySoul):
        if not soul.memories:
            return
        latest = soul.memories[-1]
        # 实际应调用 embedding model
        qdrant_client.upsert(
            collection_name="puppy_memories",
            points=[{
                "id": latest.id,
                "vector": [0.1] * 1536,
                "payload": latest.model_dump()
            }]
        )
