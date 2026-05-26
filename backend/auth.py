from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import httpx

from config import settings
from models.auth import User, UserRead, UserCreate, UserRole
from database import get_db
from sqlmodel import Session, select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.exec(select(User).where(User.id == user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_role(required_role: UserRole):
    """角色权限检查器"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value < required_role.value:
            raise HTTPException(status_code=403, detail="权限不足")
        return current_user
    return role_checker


@router.post("/login")
async def login(form_data: UserCreate, db: Session = Depends(get_db)):
    """用户登录（邮箱密码）"""
    if not form_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="密码不能为空")

    user = db.exec(select(User).where(User.email == form_data.email)).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "user": UserRead.model_validate(user),
        "token": access_token,
        "refreshToken": None  # 可扩展 refresh token 机制
    }


@router.post("/register")
async def register(form_data: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    if not form_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="密码不能为空")

    # 检查邮箱是否已存在
    existing_user = db.exec(select(User).where(User.email == form_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(form_data.password)
    new_user = User(
        email=form_data.email,
        hashed_password=hashed_password,
        role=UserRole.USER
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "user": UserRead.model_validate(new_user),
        "token": access_token,
        "refreshToken": None
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """用户登出（可在黑名单中记录 token）"""
    # TODO: 实现 token 黑名单机制
    return {"message": "已成功登出"}


@router.post("/refresh")
async def refresh_token(refresh_data: dict, db: Session = Depends(get_db)):
    """刷新访问令牌"""
    # TODO: 实现 refresh token 逻辑
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token 暂未实现"
    )


# Google OAuth
@router.get("/google/login")
async def google_login():
    """Google OAuth 登录入口"""
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?client_id={settings.GOOGLE_CLIENT_ID}"
               f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile"
    }


@router.get("/github/login")
async def github_login():
    """GitHub OAuth 登录入口"""
    return {
        "url": f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}"
               f"&redirect_uri={settings.GITHUB_REDIRECT_URI}&scope=user:email"
    }


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Google OAuth 回调"""
    # TODO: 实现完整的 OAuth 回调逻辑
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        # 处理 token 和用户信息...
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google OAuth 回调暂未完全实现"
    )
