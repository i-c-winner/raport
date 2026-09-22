from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_decision_and_change_crud() -> None:
    login = client.post(
        "/auth/login",
        json={"email": "pm@projectcontrol.local", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    decision = client.post(
        "/projects/1/decisions",
        json={
            "title": "Выбор подрядчика",
            "description": "Подтвердить подрядчика после тендера.",
            "status": "pending",
            "required_date": "2026-09-30",
            "decision_text": "Рассмотрим предложения подрядчиков.",
        },
        headers=headers,
    )
    assert decision.status_code == 200, decision.text
    decision_payload = decision.json()
    assert decision_payload["title"] == "Выбор подрядчика"

    updated_decision = client.patch(
        f"/projects/1/decisions/{decision_payload['id']}",
        json={"status": "approved", "decision_text": "Подрядчик утвержден."},
        headers=headers,
    )
    assert updated_decision.status_code == 200, updated_decision.text
    assert updated_decision.json()["status"] == "approved"

    change = client.post(
        "/projects/1/changes",
        json={
            "title": "Замена кабельной линии",
            "description": "Установка новой линии питания.",
            "reason": "Необходимо устранить риск нагрузки.",
            "status": "draft",
            "required_date": "2026-10-05",
        },
        headers=headers,
    )
    assert change.status_code == 200, change.text
    change_payload = change.json()
    assert change_payload["title"] == "Замена кабельной линии"

    updated_change = client.patch(
        f"/projects/1/changes/{change_payload['id']}",
        json={"status": "approved", "reason": "Решение принято после оценки."},
        headers=headers,
    )
    assert updated_change.status_code == 200, updated_change.text
    assert updated_change.json()["status"] == "approved"
