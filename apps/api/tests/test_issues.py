from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_and_update_issue() -> None:
    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/projects/1/issues",
        json={
            "title": "Проблема с поставкой",
            "description": "Нужно проверить сроки поставки материалов.",
            "category": "Logistics",
            "priority": "high",
            "severity": "critical",
            "status": "open",
            "action_required": "Провести аудит поставщика.",
            "schedule_impact_days": 12,
            "cost_impact": 15000,
            "due_date": "2026-09-30",
        },
        headers=headers,
    )
    assert create.status_code == 200, create.text
    issue = create.json()
    assert issue["title"] == "Проблема с поставкой"
    assert issue["status"] == "open"

    unchanged = client.patch(
        f"/projects/1/issues/{issue['id']}",
        json={"status": "open"},
        headers=headers,
    )
    assert unchanged.status_code == 200, unchanged.text
    assert unchanged.json()["status"] == "open"

    history = client.get(f"/projects/1/issues/{issue['id']}/changes", headers=headers)
    assert history.status_code == 200, history.text
    assert history.json() == []

    update = client.patch(
        f"/projects/1/issues/{issue['id']}",
        json={
            "status": "in_progress",
            "priority": "critical",
            "severity": "high",
        },
        headers=headers,
    )
    assert update.status_code == 200, update.text
    payload = update.json()
    assert payload["status"] == "in_progress"
    assert payload["priority"] == "critical"
    assert payload["severity"] == "high"

    history_after = client.get(f"/projects/1/issues/{issue['id']}/changes", headers=headers)
    assert history_after.status_code == 200, history_after.text
    assert len(history_after.json()) >= 1
