import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provides a TestClient instance for the entire test session."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables before each test."""
    from models import Base, engine, SessionLocal, DBUserGoal
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Ensure a default user goal exists
    db = SessionLocal()
    try:
        if not db.query(DBUserGoal).first():
            db.add(DBUserGoal(baseline=550.0, target=400.0, xp=0, level=1))
            db.commit()
    finally:
        db.close()
