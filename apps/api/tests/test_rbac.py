from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_auth_login_missing_user() -> None:
    response = client.post("/auth/login", json={"email": "no-user@example.com", "password": "123"})
    assert response.status_code == 401


def test_health_route() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
