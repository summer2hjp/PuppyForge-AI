from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timezone

from database import get_db
from auth import get_current_user
from models.auth import User
from models.interaction import Interaction, InteractionCreate, InteractionRead 

router = APIRouter(prefix="/interactions", tags=["Interactions"])

@router.post("/", response_model=InteractionRead)
async def create_interaction(
    interaction_data: InteractionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_interaction = Interaction(
        **interaction_data.model_dump(),
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(new_interaction)
    await db.commit()
    await db.refresh(new_interaction)
    return new_interaction

@router.get("/", response_model=List[InteractionRead])
async def get_user_interactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Interaction)
        .where(Interaction.user_id == current_user.id)
        .order_by(Interaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{interaction_id}", response_model=InteractionRead)
async def get_interaction(
    interaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Interaction).where(
            Interaction.id == interaction_id,
            Interaction.user_id == current_user.id
        )
    )
    interaction = result.scalars().first()
    if not interaction:
        raise HTTPException(status_code=404, detail="互动记录不存在")
    return interaction
