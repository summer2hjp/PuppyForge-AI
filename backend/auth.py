from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import httpx

from config import settings
from models.auth import User, UserRead, UserRole
from database import get_db
from sqlmodel import Session, select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

# ==================== OAuth 配置 ====================
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID = settings.GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET = settings.GITHUB_CLIENT_SECRET

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="无效凭证")
    except JWTError:
        raise HTTPException(status_code=401, detail="无效凭证")

    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="用户不存在或未激活")
    return user

def require_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role < required_role:  # 简单枚举比较
            raise HTTPException(status_code=403, detail="权限不足")
        return current_user
    return role_checker

# ==================== OAuth 路由 ====================
@router.get("/google/login")
async def google_login():
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:8000/auth/google/callback&response_type=code&scope=email profile"
    }

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:8000/auth/google/callback"
        })
        token_data = token_resp.json()
        
        user_resp = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", 
                                   headers={"Authorization": f"Bearer {token_data['access_token']}"})
        user_info = user_resp.json()

    # 创建或获取用户
    user = db.exec(select(User).where(User.google_id == user_info["id"])).first()
    if not user:
        user = User(
            email=user_info["email"],
            google_id=user_info["id"],
            role=UserRole.USER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": UserRead.from_orm(user)}

# GitHub 同理
@router.get("/github/login")
async def github_login():
    return {
        "url": f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri=http://localhost:8000/auth/github/callback&scope=user:email"
    }

@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    # 类似 Google 处理逻辑，省略重复代码（实际项目请补全）
    # ...
    pass

# ==================== Admin 后台路由 ====================
@router.get("/admin/users", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def admin_get_users(db: Session = Depends(get_db)):
    users = db.exec(select(User)).all()
    return [UserRead.from_orm(u) for u in users]

@router.post("/admin/promote/{user_id}", dependencies=[Depends(require_role(UserRole.SUPERADMIN))])
async def promote_user(user_id: str, db: Session = Depends(get_db)):
    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(404, "用户不存在")
    user.role = UserRole.ADMIN
    db.commit()
    return {"status": "success", "new_role": user.role}
