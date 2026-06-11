from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone

from database import get_db
from auth import get_current_user
from models.auth import User
from models.soul import PuppySoul, PuppySoulCreate, PuppySoulRead, PuppySoulUpdate, PuppySoulDetail

router = APIRouter(prefix="", tags=["Soul Management"])

_DEFAULT_TRAITS = {
    "loyalty": 65.0, "chaos": 85.0, "curiosity": 92.0,
    "aggression": 48.0, "affection": 78.0,
    "intelligence": 70.0, "rebellion": 30.0,
}

_DEFAULT_SOUL_NAME = "SummerPup"
_DEFAULT_BREED = "赛博边境牧羊犬"


@router.post("/", response_model=PuppySoulRead)
async def create_soul(
    soul_data: PuppySoulCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count_result = await db.execute(
        select(func.count()).select_from(PuppySoul).where(PuppySoul.user_id == current_user.id)
    )
    count = count_result.scalar()
    if count >= 3:
        raise HTTPException(status_code=400, detail="已达到最大宠物创建数量限制")

    new_soul = PuppySoul(**soul_data.model_dump(), user_id=current_user.id)
    db.add(new_soul)
    await db.commit()
    await db.refresh(new_soul)
    return new_soul


@router.get("/", response_model=List[PuppySoulRead])
async def list_souls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PuppySoul).where(PuppySoul.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/my-soul", response_model=PuppySoulDetail)
async def get_my_soul(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的默认灵魂，不存在则自动创建"""
    result = await db.execute(
        select(PuppySoul).where(PuppySoul.user_id == current_user.id).limit(1)
    )
    soul = result.scalars().first()

    if not soul:
        new_soul = PuppySoul(
            name=_DEFAULT_SOUL_NAME,
            breed=_DEFAULT_BREED,
            gender="unknown",
            is_active=True,
            user_id=current_user.id,
        )
        db.add(new_soul)
        await db.commit()
        await db.refresh(new_soul)
        soul = new_soul

    # 构造包含默认性格数据的详情响应
    return PuppySoulDetail(
        **soul.model_dump(),
        traits=_DEFAULT_TRAITS,
        level=1,
        total_interactions=0,
        soul_fuel=100.0,
        evolution_stage="puppy",
    )


@router.get("/{soul_id}", response_model=PuppySoulRead)
async def get_soul(
    soul_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PuppySoul).where(
            PuppySoul.id == soul_id,
            PuppySoul.user_id == current_user.id
        )
    )
    soul = result.scalars().first()
    if not soul:
        raise HTTPException(status_code=404, detail="宠物档案不存在")
    return soul


@router.put("/{soul_id}", response_model=PuppySoulRead)
async def update_soul(
    soul_id: int,
    update_data: PuppySoulUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PuppySoul).where(
            PuppySoul.id == soul_id,
            PuppySoul.user_id == current_user.id
        )
    )
    soul = result.scalars().first()
    if not soul:
        raise HTTPException(status_code=404, detail="宠物档案不存在")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(soul, key, value)

    db.add(soul)
    await db.commit()
    await db.refresh(soul)
    return soul


@router.delete("/{soul_id}")
async def delete_soul(
    soul_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PuppySoul).where(
            PuppySoul.id == soul_id,
            PuppySoul.user_id == current_user.id
        )
    )
    soul = result.scalars().first()
    if not soul:
        raise HTTPException(status_code=404, detail="宠物档案不存在")

    await db.delete(soul)
    await db.commit()
    return {"message": "删除成功"}
