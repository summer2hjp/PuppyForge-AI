from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from auth import get_current_user
from models.auth import User
from models.soul import PuppySoul, PuppySoulCreate, PuppySoulRead, PuppySoulUpdate

router = APIRouter(prefix="/souls", tags=["Soul Management"])

@router.post("/", response_model=PuppySoulRead)
async def create_soul(
    soul_data: PuppySoulCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count_result = await db.exec(
        select(func.count()).select_from(PuppySoul).where(PuppySoul.user_id == current_user.id)
    )
    count = count_result.one()
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
    result = await db.exec(
        select(PuppySoul).where(PuppySoul.user_id == current_user.id)
    )
    return result.all()

@router.get("/{soul_id}", response_model=PuppySoulRead)
async def get_soul(
    soul_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.exec(
        select(PuppySoul).where(
            PuppySoul.id == soul_id,
            PuppySoul.user_id == current_user.id
        )
    )
    soul = result.first()
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
    result = await db.exec(
        select(PuppySoul).where(
            PuppySoul.id == soul_id,
            PuppySoul.user_id == current_user.id
        )
    )
    soul = result.first()
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
    result = await db.exec(
        select(PuppySoul).where(
            PuppySoul.id == soul_id,
            PuppySoul.user_id == current_user.id
        )
    )
    soul = result.first()
    if not soul:
        raise HTTPException(status_code=404, detail="宠物档案不存在")

    await db.delete(soul)
    await db.commit()
    return {"message": "删除成功"}
