import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from datetime import datetime

# ====================== PostgreSQL 配置 ======================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:password@localhost:5432/puppyforge")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class SoulDB(Base):
    __tablename__ = "souls"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    traits = Column(JSON)
    last_active = Column(DateTime, default=datetime.utcnow)
    total_interactions = Column(Integer, default=0)
    evolution_stage = Column(String, default="puppy")


# 创建表
Base.metadata.create_all(bind=engine)

# ====================== Qdrant 向量数据库 ======================
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))

qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def init_qdrant():
    collections = qdrant_client.get_collections().collections
    if not any(c.name == "puppy_memories" for c in collections):
        qdrant_client.create_collection(
            collection_name="puppy_memories",
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
        print("✅ Qdrant 集合 'puppy_memories' 已创建")

init_qdrant()

# 获取 DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
