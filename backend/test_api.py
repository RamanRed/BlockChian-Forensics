import httpx

try:
    resp = httpx.post("http://127.0.0.1:8000/api/auth/register", json={
        "name": "tester",
        "email": "tester@test.com",
        "password": "SecurePass123",
        "role": "io"
    })
    print(resp.status_code)
    print(resp.json())
except Exception as e:
    print(f"Error: {e}")
