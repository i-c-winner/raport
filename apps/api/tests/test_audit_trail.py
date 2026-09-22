from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_audit_trail_lists_risk_changes() -> None:
    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    risk = client.post(
        "/projects/1/risks",
        json={
            "title": "Тестовый риск для аудита",
            "description": "Проверка журнала аудита",
            "category": "schedule",
            "probability": "medium",
            "impact_level": "high",
            "rating": "high",
            "status": "open",
        },
        headers=headers,
    )
    assert risk.status_code == 200, risk.text
    risk_id = risk.json()["id"]

    update = client.patch(
        f"/projects/1/risks/{risk_id}",
        json={"status": "occurred", "rating": "critical"},
        headers=headers,
    )
    assert update.status_code == 200, update.text

    audit = client.get(f"/projects/1/audit-logs", headers=headers)
    assert audit.status_code == 200, audit.text
    payload = audit.json()
    assert payload
    assert any(item["entity_type"] == "risk" and item["field_name"] in {"status", "rating"} for item in payload)
    assert any(item.get("entity_name") for item in payload)
