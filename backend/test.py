import httpx

try:
    response = httpx.post("http://127.0.0.1:8000/api/auth/register", json={
        "name": "Arjun",
        "email": "arjun@police.gov.in",
        "password": "SecurePass123",
        "role": "io"
    })
    print("Status:", response.status_code)
    print("Body:", response.json())
except Exception as e:
    print(e)
