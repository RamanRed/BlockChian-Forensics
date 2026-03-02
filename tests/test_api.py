"""
Tests for FastAPI endpoints
Tests authentication, evidence upload, verification, and admin routes
"""

import pytest
import sys
import json
from pathlib import Path

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))

from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models import User, UserRole
from auth.password_utils import hash_password
from datetime import datetime


@pytest.fixture(scope="function")
def db():
    """Create a fresh test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user(db):
    """Create a test user in the database."""
    from database import SessionLocal
    session = SessionLocal()
    try:
        user = User(
            name="Test User",
            email="test@example.com",
            password_hash=hash_password("TestPassword123"),
            role=UserRole.investigator,
            is_active=1
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    finally:
        session.close()


class TestAuthRoutes:
    """Test authentication endpoints."""

    def test_register_user(self, client):
        """Test user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "name": "New User",
                "email": "newuser@example.com",
                "password": "SecurePass123",
                "role": "investigator"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        print("✓ User registration successful")

    def test_register_duplicate_email(self, client, test_user):
        """Test that registering with duplicate email fails."""
        response = client.post(
            "/api/auth/register",
            json={
                "name": "Another User",
                "email": "test@example.com",
                "password": "SecurePass123",
                "role": "investigator"
            }
        )
        assert response.status_code == 400
        print("✓ Duplicate email correctly rejected")

    def test_login_success(self, client, test_user):
        """Test successful login."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print("✓ Login successful")

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123"
            }
        )
        assert response.status_code == 401
        print("✓ Wrong password correctly rejected")


class TestHealthRoute:
    """Test health check endpoint."""

    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        print("✓ Health check passed")

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Root endpoint working")


class TestEvidenceRoutes:
    """Test evidence upload and retrieval."""

    def test_get_evidence_without_auth(self, client):
        """Test that accessing evidence without auth fails."""
        response = client.get("/api/evidence/1")
        assert response.status_code == 403  # Unauthorized
        print("✓ Protected endpoint correctly requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
