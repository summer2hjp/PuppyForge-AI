from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from sqlmodel import SQLModel, Field, Relationship
import uuid

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 一用户多灵魂（宠物）
    souls: list["PuppySoul"] = Relationship(back_populates="owner")

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: str
    email: EmailStr
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
