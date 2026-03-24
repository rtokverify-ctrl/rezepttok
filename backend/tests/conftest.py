import pytest
import sys
import os

# Add backend dir to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import AsyncMock, patch

from database import Base, get_db

# ── Mock mail_manager BEFORE importing app ───────────────────────────
# The app imports auth_router which imports mail_manager at register time.
# We need to patch it so background tasks don't fail.
import services.mail_manager
services.mail_manager.mail_manager.send_verification_code = AsyncMock(return_value={"ok": True})

from main import app
from limiter import limiter

# Disable rate limiter for tests to prevent 429 Too Many Requests errors
limiter.enabled = False

# ── In-Memory SQLite for tests ──────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_db.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Clean up test db file
    if os.path.exists("./test_db.db"):
        try:
            os.remove("./test_db.db")
        except PermissionError:
            pass


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    """Test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Direct DB session for test setup."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Helper: Create a user and return token ───────────────────────────
def create_verified_user(client: TestClient, username="testuser", email="test@test.com", password="TestPass123!"):
    """Register and return auth token (auto-verified)."""
    r = client.post("/register", json={
        "username": username, "email": email,
        "password": password, "age": 20
    })
    token = r.json().get("access_token", "")
    return token


@pytest.fixture
def auth_token(client):
    """Creates user 'testuser' and returns Bearer token."""
    return create_verified_user(client, "testuser", "test@test.com", "TestPass123!")


@pytest.fixture
def second_auth_token(client):
    """Creates user 'testuser2' and returns Bearer token."""
    return create_verified_user(client, "testuser2", "test2@test.com", "TestPass456!")


def auth_header(token):
    """Helper to create auth header dict."""
    return {"Authorization": f"Bearer {token}"}
