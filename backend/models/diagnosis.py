from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship

from models.auth import User
from models.soul import PuppySoul


class DiagnosisBase(SQLModel):
    """诊断报告基础模型"""
    # 核心诊断结果
    diagnosis_summary: str = Field(..., sa_column=Column(Text), description="诊断总结")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="置信度 0-1")
    risk_level: int = Field(..., ge=1, le=5, description="风险等级 1-5")
    
    # 详细分析数据 (存储为 JSON)
    behavioral_analysis: Optional[Dict[str, Any]] = Field(None, sa_column=Column(JSON), description="行为分析 JSON")
    health_indicators: Optional[Dict[str, Any]] = Field(None, sa_column=Column(JSON), description="健康指标 JSON")
    soul_traits_detected: Optional[Dict[str, Any]] = Field(None, sa_column=Column(JSON), description="检测到的灵魂特质 JSON")
    
    # 建议列表
    suggestions: List[str] = Field(default_factory=list, sa_column=Column(JSON), description="建议列表 JSON")
    
    # 原始数据引用
    input_text: Optional[str] = Field(None, sa_column=Column(Text), description="输入文本")
    image_url: Optional[str] = Field(None, max_length=500, description="分析的图片 URL")
    
    # 模型元数据
    model_version: str = Field(default="v1.0", max_length=50, description="AI 模型版本")


class DiagnosisCreate(DiagnosisBase):
    """创建诊断报告请求模型"""
    soul_id: Optional[int] = None


class DiagnosisRead(DiagnosisBase):
    """诊断报告响应模型"""
    id: int
    user_id: int
    soul_id: Optional[int]
    created_at: datetime


class Diagnosis(DiagnosisBase, table=True):
    """诊断报告数据库模型"""
    __tablename__ = "diagnoses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(..., foreign_key="users.id", index=True)
    soul_id: Optional[int] = Field(None, foreign_key="puppy_souls.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # 关系定义
    user: "User" = Relationship(back_populates="diagnoses")
    soul: Optional["PuppySoul"] = Relationship(back_populates="diagnoses")


# 如果需要反向关系，请在 User 和 PuppySoul 模型中添加：
# In models/auth.py -> class User:
#   diagnoses: List["Diagnosis"] = Relationship(back_populates="user")
#   interactions: List["Interaction"] = Relationship(back_populates="user")
#   souls: List["PuppySoul"] = Relationship(back_populates="user")

# In models/soul.py -> class PuppySoul:
#   diagnoses: List["Diagnosis"] = Relationship(back_populates="soul")
#   interactions: List["Interaction"] = Relationship(back_populates="soul")
