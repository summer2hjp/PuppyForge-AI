from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_current_user
from models.auth import User

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user
