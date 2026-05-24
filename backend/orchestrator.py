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
from database import get_db, qdrant_client
from agents import (
    diagnosis_agent,
    growth_agent,
    prediction_agent,
    rebel_agent,
    trait_drift_agent,
    memory_weaver
)

logger = logging.getLogger("puppyforge.orchestrator")


class SoulState(Dict):
    """LangGraph 核心状态"""
    soul: PuppySoul
    user_input: str
    visual_features: Optional[Dict] = None
    context: Optional[Dict] = None
    agent_results: Dict[str, Any] = {}
    final_response: str = ""
    should_rebel
