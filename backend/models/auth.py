from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from sqlmodel import SQLModel, Field, Relationship
import uuid

class UserRole(str):
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: Optional[str] = None
    is_active: bool = True
    role: UserRole = Field(default=UserRole.USER)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # OAuth 信息
    google_id: Optional[str] = Field(default=None, unique=True)
    github_id: Optional[str] = Field(default=None, unique=True)
    
    souls: list["PuppySoul"] = Relationship(back_populates="owner")

class UserCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = None

class UserRead(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
