# ──────────────────────────────────────────────────────────────
#  Test: Backend API Endpoints
# ──────────────────────────────────────────────────────────────

import pytest
from pathlib import Path
from httpx import AsyncClient
import sys

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND_PATH))


@pytest.mark.asyncio
class TestHealthEndpoint:
    """Test basic backend health and root endpoints."""

    async def test_health_check(self):
        """Test /api/health endpoint."""
        from main import app
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert "version" in data
            print(f"\n  Health check: {data}")

    async def test_root_endpoint(self):
        """Test / root endpoint."""
        from main import app
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"\n  Root response: {data}")
