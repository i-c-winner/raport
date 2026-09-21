from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_and_update_milestone() -> None:
    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/projects/1/milestones",
        json={
            "code": "MS-101",
            "title": "Новый этап",
            "description": "Тестовый этап",
            "baseline_date": "2026-10-01",
            "forecast_date": "2026-10-12",
            "status": "planned",
        },
        headers=headers,
    )
    assert create.status_code == 200, create.text
    milestone = create.json()
    assert milestone["title"] == "Новый этап"
    assert milestone["status"] == "planned"

    update = client.patch(
        f"/projects/1/milestones/{milestone['id']}",
        json={
            "forecast_date": "2026-10-15",
            "status": "completed",
        },
        headers=headers,
    )
    assert update.status_code == 200, update.text
    payload = update.json()
    assert payload["forecast_date"] == "2026-10-15"
    assert payload["status"] == "completed"

    cancelled = client.patch(
        f"/projects/1/milestones/{milestone['id']}",
        json={"status": "cancelled"},
        headers=headers,
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "cancelled"
