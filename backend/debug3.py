from fastapi.testclient import TestClient
from main import app
import traceback

client = TestClient(app, raise_server_exceptions=True)

try:
    response = client.post("/api/auth/register", json={
        "name": "SuperUser",
        "email": "superxyx@police.gov.in",
        "password": "SecurePass123",
        "role": "io"
    })
    print("Status:", response.status_code)
    print("Body:", response.json())
except Exception as e:
    print("FASTAPI CRASH TRACEBACK:")
    traceback.print_exc()
