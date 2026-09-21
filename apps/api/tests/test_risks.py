from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_risk_change_history_and_auto_issue_creation() -> None:
    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_risk = client.post(
        "/projects/1/risks",
        json={
            "title": "Риск задержки поставок",
            "description": "Поставщик может задержать материалы",
            "probability": "medium",
            "impact_level": "high",
            "rating": "high",
            "status": "open",
        },
        headers=headers,
    )
    assert create_risk.status_code == 200, create_risk.text
    risk = create_risk.json()
    risk_id = risk["id"]

    unchanged = client.patch(
        f"/projects/1/risks/{risk_id}",
        json={"status": "open"},
        headers=headers,
    )
    assert unchanged.status_code == 200, unchanged.text
    assert unchanged.json()["status"] == "open"

    history = client.get(f"/projects/1/risks/{risk_id}/changes", headers=headers)
    assert history.status_code == 200, history.text
    assert history.json() == []

    updated = client.patch(
        f"/projects/1/risks/{risk_id}",
        json={"status": "occurred"},
        headers=headers,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "occurred"

    history_after = client.get(f"/projects/1/risks/{risk_id}/changes", headers=headers)
    assert history_after.status_code == 200, history_after.text
    assert len(history_after.json()) >= 1

    issues = client.get("/projects/1/issues", headers=headers)
    assert issues.status_code == 200, issues.text
    issue_titles = [item["title"] for item in issues.json()]
    assert any("Риск задержки поставок" in title for title in issue_titles)
