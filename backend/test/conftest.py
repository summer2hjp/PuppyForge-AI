import pytest
from fastapi.testclient import TestClient
from backend.main import app
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
