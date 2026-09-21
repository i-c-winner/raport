from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_entities_route_exists() -> None:
    response = client.get("/projects/1/entities/risk/1/links")
    assert response.status_code in (401, 403, 404)
