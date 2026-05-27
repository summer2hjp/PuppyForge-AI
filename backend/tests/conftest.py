import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parents[2]
backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_dir))

collect_ignore = [
    "test_ai_agent.py",
    "test_auth.py",
    "test_models.py",
    "test_orchestrator.py",
    "test_performance.py",
    "test_security.py",
    "test_swarm_orchestrator.py",
    "test_vision.py",
]

from main import app
from backend.database import Base, engine, SessionLocal

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    app.dependency_overrides = {}
    return TestClient(app)

@pytest.fixture
def mock_analyze_image(mocker):
    return mocker.patch('backend.vision.analyze_pet_image')
