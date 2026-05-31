from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
import httpx

from sqlmodel import select, SQLModel
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.auth import User, UserRead, UserCreate, UserRole
from database import get_db

# 初始化密码上下文和 OAuth2 Scheme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

#router = APIRouter(prefix="/auth", tags=["Authentication"])
router = APIRouter(tags=["Authentication"])

# --- 辅助函数 ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    import bcrypt
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """生成密码哈希 (处理 bcrypt 72字节限制)"""
    # bcrypt 有 72 字节的限制，如果密码过长则手动截断
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password_bytes[:72].decode('utf-8', errors='ignore')
    # 使用 bcrypt 直接哈希，避免 passlib 的兼容性问题
    import bcrypt
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> dict:
    """验证 Token 并返回 payload (同步操作，用于内部调用)"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- 依赖注入 ---

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    """获取当前用户 (异步数据库查询)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 异步执行数据库查询
    result = await db.exec(select(User).where(User.id == user_id))
    user = result.first()
    
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(required_role: UserRole):
    """角色权限检查器 (返回异步依赖函数)"""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value < required_role.value:
            raise HTTPException(status_code=403, detail="权限不足")
        return current_user
    return role_checker

# --- 路由处理 ---

@router.post("/login")
async def login(form_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """用户登录（邮箱密码）"""
    if not form_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="密码不能为空")

    # 异步查询用户
    result = await db.exec(select(User).where(User.email == form_data.email))
    user = result.first()
    
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
        "refreshToken": None
    }

@router.post("/register")
async def register(form_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """用户注册"""
    if not form_data.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="密码不能为空")

    # 异步检查邮箱是否存在
    result = await db.exec(select(User).where(User.email == form_data.email))
    existing_user = result.first()
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
    await db.commit()  # 异步提交
    await db.refresh(new_user)  # 异步刷新
    
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "user": UserRead.model_validate(new_user),
        "token": access_token,
        "refreshToken": None
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """用户登出"""
    # TODO: 实现 token 黑名单机制 (需配合 Redis)
    return {"message": "已成功登出"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
        "is_active": current_user.is_active
    }

@router.post("/refresh")
async def refresh_token(refresh_data: dict, db: AsyncSession = Depends(get_db)):
    """刷新访问令牌"""
    # TODO: 实现 refresh token 逻辑
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token 暂未实现"
    )

# --- OAuth 第三方登录 ---

@router.get("/google/login")
async def google_login():
    """Google OAuth 登录入口"""
    return {
        "url": (
            f"https://accounts.google.com/o/oauth2/auth?"
            f"client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
            f"&response_type=code&scope=email profile"
        )
    }

@router.get("/github/login")
async def github_login():
    """GitHub OAuth 登录入口"""
    return {
        "url": (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={settings.GITHUB_CLIENT_ID}"
            f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
            f"&scope=user:email"
        )
    }

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Google OAuth 回调 (异步 HTTP 请求)"""
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                },
                headers={"Accept": "application/json"}
            )
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # 获取用户信息
            access_token = tokens.get("access_token")
            user_info_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info_resp.raise_for_status()
            user_info = user_info_resp.json()
            
            # 查找或创建用户
            email = user_info.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="无法获取邮箱")
                
            result = await db.exec(select(User).where(User.email == email))
            user = result.first()
            
            if not user:
                # 创建新用户
                user = User(
                    email=email,
                    hashed_password="", # OAuth 用户通常没有密码
                    role=UserRole.USER,
                    is_active=True
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            
            access_token = create_access_token(data={"sub": user.id})
            
            return {
                "user": UserRead.model_validate(user),
                "token": access_token,
                "provider": "google"
            }
            
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth 验证失败"
            )

@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """GitHub OAuth 回调"""
    # 类似 Google 的实现逻辑
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="GitHub OAuth 回调暂未完全实现"
    )
